import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Plus, Loader2, Edit2, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface CreateServicePayload {
  businessId: number;
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  category?: string;
}

export default function ServiceManagementForm() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [serviceName, setServiceName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const queryClient = useQueryClient();

  const createServiceMutation = useMutation({
    mutationFn: (newService: CreateServicePayload) => {
      return api<any>("/services", {
        method: "POST",
        body: newService,
      });
    },
    onSuccess: () => {
      toast.success("Service created successfully!");
      setServiceName("");
      setDescription("");
      setDuration("");
      setPrice("");
      setCategory("");
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["services"] }); // Invalidate to refetch
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create service");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!serviceName || !duration || !price) {
      toast.error("Please fill in all required fields");
      return;
    }

    createServiceMutation.mutate({
      // Use the businessId from the logged-in user's auth context.
      // The 'user' object for an owner will contain their businessId.
      // We also need to ensure the businessId is a number if your backend expects it.
      businessId: user?.businessId ? parseInt(user.businessId) : 0,
      name: serviceName,
      description: description || undefined,
      durationMinutes: parseInt(duration),
      price: parseFloat(price),
      category: category || undefined,
    });
  };

  const services = [
    { id: 1, name: "Classic Lash Extensions", duration: 120, price: 150, category: "Lashes" },
    { id: 2, name: "Volume Lash Extensions", duration: 150, price: 200, category: "Lashes" },
    { id: 3, name: "Lash Fill (2 weeks)", duration: 60, price: 75, category: "Lashes" },
    { id: 4, name: "Lash Removal", duration: 30, price: 30, category: "Lashes" },
    { id: 5, name: "Brow Lamination", duration: 45, price: 80, category: "Eyebrows" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-amber-900">Service Management</h1>
            <p className="text-gray-500 mt-2">Manage your beauty services and pricing</p>
          </div>
          <Button
            onClick={() => setLocation("/owner/dashboard")}
            variant="outline" className="border-amber-600 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
          >
            Back to Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Service Form */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-600" />
                <span className="text-amber-800">Add New Service</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!showForm ? (
                <Button
                  onClick={() => setShowForm(true)}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Create Service
                </Button>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Service Name *</Label>
                    <Input
                      id="name"
                      value={serviceName}
                      onChange={(e) => setServiceName(e.target.value)}
                      placeholder="e.g., Hair Cut"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g., Hair, Nails"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (minutes) *</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="60"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Price (BZ$) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="45.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="desc">Description</Label>
                    <Textarea
                      id="desc"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Service details..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={createServiceMutation.isPending}
                      className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      {createServiceMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create"
                      )}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setShowForm(false)}
                      variant="outline" className="flex-1 border-amber-600 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Services List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader> 
                <CardTitle className="text-amber-800">Current Services</CardTitle>
                <CardDescription>
                  {services.length} service{services.length !== 1 ? "s" : ""} available
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{service.name}</h3>
                        <div className="flex gap-4 mt-2 text-sm text-gray-500">
                          <span>Duration: {service.duration} min</span>
                          <span>Price: BZ${service.price}</span>
                          <span className="text-amber-700 font-medium">{service.category}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
