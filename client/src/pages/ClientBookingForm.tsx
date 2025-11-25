import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";
import { toast, Toaster } from "sonner";
import { Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Types
interface Business { id: string; name: string; }
interface Service { id: string; name: string; price: string; }
interface Appointment { id: string; }

export default function ClientBookingForm() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [businessId, setBusinessId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  const [ampm, setAmPm] = useState("am");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [specialNotes, setSpecialNotes] = useState("");
  const queryClient = useQueryClient();

  const { data: businesses, isLoading: isLoadingBusinesses } = useQuery<Business[]>({
    queryKey: ["businesses"],
    queryFn: () => api("/businesses"),
  });
  const { data: services, isLoading: isLoadingServices } = useQuery<Service[]>({
    queryKey: ["services"],
    queryFn: () => api("/services"),
  });

  useEffect(() => {
    if (user) {
      setClientName(user.name || "");
      setClientEmail(user.email || "");
    }
  }, [user]);

  const createAppointmentMutation = useMutation({
    mutationFn: (newAppointment: any) => {
      return api<Appointment>("/appointments", {
        method: "POST",
        body: newAppointment,
      });
    },
    onSuccess: async (newAppointment) => {
      toast.success("Booking created successfully!");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });

      // Send confirmation email
      try {
        const details = {
          business: businesses?.find(b => b.id === businessId)?.name,
          service: services?.find(s => s.id === serviceId)?.name,
          date: appointmentDate,
          time: `${hour}:${minute} ${ampm}`,
          name: clientName,
        };

        // 1. Generate email content
        const geminiResponse = await fetch('/api/ai/generate-description', { // Corrected path
          method: 'POST', // Added method
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: `Write a friendly booking confirmation email for a customer. Include booking details: ${JSON.stringify(details)}. Keep tone professional but warm.`
          }),
        });

        if (!geminiResponse.ok) {
          throw new Error('Failed to generate email content');
        }

        const geminiResult = await geminiResponse.json();
        const emailContent = geminiResult.content;

        // 2. Send the email
        await fetch('/api/notifications/send-email', { // Assuming this path exists
          method: 'POST', // Added method
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: clientEmail,
            subject: 'Your Booking Confirmation',
            message: emailContent,
          }),
        });

        toast.success("Confirmation email sent!");
      } catch (error) {
        console.error("Failed to send confirmation email:", error);
        toast.error("Failed to send confirmation email.");
      }

      if (newAppointment?.id) {
        setLocation(`/booking/confirmation/${newAppointment.id}`);
      } else {
        setLocation('/dashboard');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "An unexpected error occurred");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId || !serviceId || !appointmentDate || !hour || !minute || !clientName || !clientEmail) {
      toast.error("Please fill in all required fields");
      return;
    }

    let twentyFourHour = parseInt(hour, 10);
    if (ampm === "pm" && twentyFourHour < 12) {
      twentyFourHour += 12;
    }
    if (ampm === "am" && twentyFourHour === 12) {
      twentyFourHour = 0;
    }

    const appointmentDateTime = new Date(`${appointmentDate}T${String(twentyFourHour).padStart(2, '0')}:${minute}`);

    createAppointmentMutation.mutate({
      businessId: businessId,
      serviceId: serviceId,
      clientName: clientName,
      clientEmail: clientEmail,
      appointmentDate: appointmentDateTime,
      durationMinutes: 60,
      specialNotes: specialNotes || undefined,
    });
  };

  // Your `api` helper likely adds the `/api` prefix.
  // By changing the calls to `api("/businesses")`, the final URL will be `/api/businesses`,
  // which the proxy will correctly forward to `http://localhost:5000/businesses`.

  const handleGoToDashboard = () => {
    if (user?.role === 'business_owner') {
      setLocation('/owner/dashboard');
    } else {
      setLocation('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9F3] p-4 py-12">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-3xl text-[#6B3A00]">Book Your Appointment</CardTitle>
              <Button variant="outline" onClick={handleGoToDashboard}>Dashboard</Button>
            </div>
            <CardDescription className="text-[#6B3A00] opacity-80 pt-2">Select your preferred service, date, and time</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingBusinesses || isLoadingServices ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-[#F7941D]" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-10"> {/* Increased spacing */}
                {/* Business Select */}
                <div className="mb-6">
                  <Label htmlFor="business">Select Business *</Label>
                  <Select value={businessId} onValueChange={setBusinessId}>
                    <SelectTrigger id="business" className="h-12 text-base">
                      <SelectValue placeholder="Choose a business" />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-amber-50 border-amber-200">
                      {businesses?.filter(b => b.id).map(b => (
                        <SelectItem key={b.id} value={String(b.id)} className="py-2 text-base focus:bg-amber-100">
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Service Select */}
                <div className="mb-6">
                  <Label htmlFor="service">Select Service *</Label>
                  <Select value={serviceId} onValueChange={setServiceId}>
                    <SelectTrigger id="service" className="h-12 text-base">
                      <SelectValue placeholder="Choose a service" />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-amber-50 border-amber-200">
                      {services?.map(service => (
                        <SelectItem key={service.id} value={service.id} className="py-2 text-base focus:bg-amber-100">
                          {service.name} - BZ${service.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Client Name */}
                <div className="mb-6">
                  <Label htmlFor="name">Your Name *</Label>
                  <Input id="name" type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} required />
                </div>

                {/* Client Email */}
                <div className="mb-6">
                  <Label htmlFor="email">Your Email *</Label>
                  <Input id="email" type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} required />
                </div>

                {/* Date */}
                <div className="mb-6">
                  <Label htmlFor="date">Appointment Date *</Label>
                  <Input id="date" type="date" value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
                </div>

                {/* Time */}
                <div className="mb-6">
                  <Label>Appointment Time *</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Select value={hour} onValueChange={setHour}>
                      <SelectTrigger><SelectValue placeholder="Hour" /></SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                          <SelectItem key={h} value={String(h)}>{String(h).padStart(2, '0')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={minute} onValueChange={setMinute}>
                      <SelectTrigger><SelectValue placeholder="Min" /></SelectTrigger>
                      <SelectContent>
                        {['00', '15', '30', '45'].map(m => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={ampm} onValueChange={setAmPm}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="am">AM</SelectItem>
                        <SelectItem value="pm">PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Notes */}
                <div className="mb-6">
                  <Label htmlFor="notes">Special Notes</Label>
                  <Textarea id="notes" value={specialNotes} onChange={(e) => setSpecialNotes(e.target.value)} rows={4} />
                </div>

                <Button type="submit" disabled={createAppointmentMutation.isPending} className="w-full bg-[#F7941D] hover:bg-[#E86E1B] text-white py-6 text-lg">
                  {createAppointmentMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Booking...
                    </>
                  ) : "Complete Booking"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
