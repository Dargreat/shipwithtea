import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Calculator, Truck, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ShipmentData {
  shipFrom: string;
  shipTo: string;
  weight: string;
  packageType: string;
  fromAddress: string;
  toAddress: string;
}

interface CalculatorProps {
  user?: any;
  onLoginRequired?: (data: ShipmentData) => void;
}

export const ShipmentCalculator = ({ user, onLoginRequired }: CalculatorProps) => {
  const [formData, setFormData] = useState<ShipmentData>({
    shipFrom: '',
    shipTo: '',
    weight: '',
    packageType: '',
    fromAddress: '',
    toAddress: '',
  });
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const { toast } = useToast();

  const countries = [
    'Nigeria',
    'Ghana',
    'USA',
    'UK',
    'Canada',
    'South Africa',
    'Kenya',
    'Uganda',
    'Cameroon',
    'Ivory Coast'
  ];

  const packageTypes = [
    'Documents',
    'Packages',
    'Electronics',
    'Clothing',
    'Books',
    'Food Items',
    'Medical Supplies'
  ];

  const calculatePrice = async () => {
    if (!formData.shipFrom || !formData.shipTo || !formData.weight || !formData.packageType) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields to calculate shipping cost.",
        variant: "destructive",
      });
      return;
    }

    setIsCalculating(true);
    
    try {
      const { data: pricing, error } = await supabase
        .from('pricing')
        .select('*')
        .eq('from_country', formData.shipFrom)
        .eq('to_country', formData.shipTo)
        .eq('package_type', formData.packageType)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!pricing) {
        // Use default pricing if not found
        const basePrice = 15;
        const pricePerKg = 25;
        const cost = basePrice + (parseFloat(formData.weight) * pricePerKg);
        setEstimatedCost(cost);
      } else {
        const cost = (pricing.base_price || 0) + (parseFloat(formData.weight) * pricing.price_per_kg);
        setEstimatedCost(cost);
      }

      toast({
        title: "Price Calculated",
        description: "Your shipping estimate is ready!",
      });
    } catch (error) {
      console.error('Error calculating price:', error);
      toast({
        title: "Calculation Error",
        description: "Unable to calculate shipping cost. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!user) {
      // Store data and redirect to login
      if (onLoginRequired) {
        onLoginRequired(formData);
      }
      return;
    }

    if (!estimatedCost) {
      toast({
        title: "Calculate Price First",
        description: "Please calculate the shipping cost before creating an order.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingOrder(true);

    try {
      const { error } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          ship_from: formData.shipFrom,
          ship_to: formData.shipTo,
          weight: parseFloat(formData.weight),
          package_type: formData.packageType,
          estimated_cost: estimatedCost,
          from_address: formData.fromAddress,
          to_address: formData.toAddress,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Order Created Successfully",
        description: "Your shipping order has been submitted. Please proceed with payment.",
      });

      // Reset form
      setFormData({
        shipFrom: '',
        shipTo: '',
        weight: '',
        packageType: '',
        fromAddress: '',
        toAddress: '',
      });
      setEstimatedCost(null);
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Order Creation Failed",
        description: "Unable to create order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingOrder(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-card">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center space-x-2 text-2xl">
          <Calculator className="h-6 w-6 text-primary" />
          <span>Calculate Shipping Cost</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="shipFrom">Ship From *</Label>
            <Select 
              value={formData.shipFrom} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, shipFrom: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select origin country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shipTo">Ship To *</Label>
            <Select 
              value={formData.shipTo} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, shipTo: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select destination country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="weight">Weight (kg) *</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              min="0.1"
              placeholder="Enter weight in kg"
              value={formData.weight}
              onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="packageType">Package Type *</Label>
            <Select 
              value={formData.packageType} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, packageType: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select package type" />
              </SelectTrigger>
              <SelectContent>
                {packageTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fromAddress">From Address</Label>
            <Input
              id="fromAddress"
              placeholder="Enter pickup address"
              value={formData.fromAddress}
              onChange={(e) => setFormData(prev => ({ ...prev, fromAddress: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="toAddress">To Address</Label>
            <Input
              id="toAddress"
              placeholder="Enter delivery address"
              value={formData.toAddress}
              onChange={(e) => setFormData(prev => ({ ...prev, toAddress: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex flex-col space-y-4">
          <Button 
            onClick={calculatePrice} 
            disabled={isCalculating}
            variant="hero"
            size="lg"
            className="w-full"
          >
            <Calculator className="h-4 w-4 mr-2" />
            {isCalculating ? 'Calculating...' : 'Calculate Shipping Cost'}
          </Button>

          {estimatedCost !== null && (
            <div className="bg-gradient-card p-6 rounded-lg border border-primary/20">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground mb-2">Estimated Shipping Cost</h3>
                <div className="text-3xl font-bold text-primary mb-4">
                  ${estimatedCost.toFixed(2)} USD
                </div>
                <div className="bg-accent/50 p-4 rounded-lg mb-4">
                  <h4 className="font-semibold mb-2">Payment Details</h4>
                  <p className="text-sm text-muted-foreground mb-1">
                    <strong>Account Number:</strong> 8130208909
                  </p>
                  <p className="text-sm text-muted-foreground mb-1">
                    <strong>Bank:</strong> Opay
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Account Name:</strong> Tosin Adegbola
                  </p>
                </div>
                <Button 
                  onClick={handleCreateOrder}
                  disabled={isCreatingOrder}
                  variant="success"
                  size="lg"
                  className="w-full"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {isCreatingOrder ? 'Creating Order...' : 'I Have Paid - Create Order'}
                </Button>
                {!user && (
                  <p className="text-sm text-muted-foreground mt-2">
                    You'll need to sign in to create an order
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};