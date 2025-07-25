import { useState, useEffect } from 'react';
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

  const [currency, setCurrency] = useState<'USD' | 'NGN'>('USD');
  const [usdCost, setUsdCost] = useState<number | null>(null);
  const [ngnCost, setNgnCost] = useState<number | null>(null);

  // Countries and package types will be dynamically loaded from pricing table
  const [countries, setCountries] = useState<string[]>([]);
  const [packageTypes, setPackageTypes] = useState<string[]>([]);

  // Predefined package types that should always be available
  const predefinedPackageTypes = ['jewelry', 'food', 'farm produce', 'fashion', 'fabric'];

  // Load available countries and package types from pricing table
  useEffect(() => {
    const loadPricingOptions = async () => {
      try {
        const { data: pricing, error } = await supabase
          .from('pricing')
          .select('from_country, to_country, package_type');

        if (error) {
          console.error('Error loading pricing options:', error);
          return;
        }

        if (pricing) {
          // Extract unique countries
          const fromCountries = pricing.map(p => p.from_country);
          const toCountries = pricing.map(p => p.to_country);
          const allCountries = [...new Set([...fromCountries, ...toCountries])];
          setCountries(allCountries.sort());

          // Extract unique package types from database and combine with predefined ones
          const dbPackageTypes = [...new Set(pricing.map(p => p.package_type))];
          const allPackageTypes = [...new Set([...predefinedPackageTypes, ...dbPackageTypes])];
          setPackageTypes(allPackageTypes.sort());
        } else {
          // If no pricing data, just use predefined package types
          setPackageTypes(predefinedPackageTypes.sort());
        }
      } catch (error) {
        console.error('Error loading pricing options:', error);
        // Fallback to predefined package types on error
        setPackageTypes(predefinedPackageTypes.sort());
      }
    };

    loadPricingOptions();
  }, []);

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
      // Fetch pricing from database - exact match only
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
        toast({
          title: "No Pricing Available", 
          description: `No pricing configuration found for route ${formData.shipFrom} to ${formData.shipTo} with package type ${formData.packageType}. Please contact support to set up pricing for this route.`,
          variant: "destructive",
        });
        return;
      }

      // Calculate USD cost
      const usdBaseCost = pricing.base_price || 0;
      const usdWeightCost = parseFloat(formData.weight) * pricing.price_per_kg;
      const totalUsdCost = usdBaseCost + usdWeightCost;
      
      // Calculate NGN cost - always calculate if base and per kg prices exist
      let totalNgnCost = null;
      if (pricing.naira_base_price !== null && pricing.naira_price_per_kg !== null) {
        const ngnBaseCost = Number(pricing.naira_base_price) || 0;
        const ngnWeightCost = parseFloat(formData.weight) * Number(pricing.naira_price_per_kg);
        totalNgnCost = ngnBaseCost + ngnWeightCost;
      }

      setUsdCost(totalUsdCost);
      setNgnCost(totalNgnCost);
      setEstimatedCost(currency === 'USD' ? totalUsdCost : totalNgnCost);

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
          currency: currency,
          naira_cost: currency === 'NGN' ? estimatedCost : ngnCost,
          from_address: formData.fromAddress,
          to_address: formData.toAddress,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Order Created Successfully!",
        description: "Your shipping order has been created and is pending approval. You can track its progress in your dashboard.",
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
      setUsdCost(null);
      setNgnCost(null);
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
    <div className="w-full max-w-4xl mx-auto overflow-x-hidden">
      <Card className="shadow-card">
        <CardHeader className="text-center px-4 sm:px-6">
          <CardTitle className="flex flex-col sm:flex-row items-center justify-center gap-2 text-lg sm:text-xl lg:text-2xl">
            <Calculator className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
            <span>Calculate Shipping Cost</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                      {type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="fromAddress">From Address</Label>
              <Input
                id="fromAddress"
                placeholder="Enter pickup address"
                value={formData.fromAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, fromAddress: e.target.value }))}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="toAddress">To Address</Label>
              <Input
                id="toAddress"
                placeholder="Enter delivery address"
                value={formData.toAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, toAddress: e.target.value }))}
                className="w-full"
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

            {(usdCost !== null || ngnCost !== null) && (
              <div className="bg-gradient-card p-3 sm:p-4 lg:p-6 rounded-lg border border-primary/20 w-full overflow-hidden">
                <div className="text-center">
                  <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-foreground mb-3 sm:mb-4">Estimated Shipping Cost</h3>
                  
                  {/* Currency Selection */}
                  <div className="flex justify-center gap-2 mb-3 sm:mb-4 flex-wrap">
                    {usdCost !== null && (
                      <Button
                        variant={currency === 'USD' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setCurrency('USD');
                          setEstimatedCost(usdCost);
                        }}
                        className="min-w-16"
                      >
                        USD
                      </Button>
                    )}
                    {ngnCost !== null && (
                      <Button
                        variant={currency === 'NGN' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setCurrency('NGN');
                          setEstimatedCost(ngnCost);
                        }}
                        className="min-w-16"
                      >
                        NGN
                      </Button>
                    )}
                  </div>

                  {/* Price Display */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                    {usdCost !== null && (
                      <div className={`p-3 rounded-lg border ${currency === 'USD' ? 'border-primary bg-primary/5' : 'border-border'} w-full`}>
                        <div className="text-xs sm:text-sm text-muted-foreground mb-1">USD Price</div>
                        <div className="text-lg sm:text-xl lg:text-2xl font-bold text-primary break-words">
                          ${usdCost.toFixed(2)}
                        </div>
                      </div>
                    )}
                    {ngnCost !== null && (
                      <div className={`p-3 rounded-lg border ${currency === 'NGN' ? 'border-primary bg-primary/5' : 'border-border'} w-full`}>
                        <div className="text-xs sm:text-sm text-muted-foreground mb-1">NGN Price</div>
                        <div className="text-lg sm:text-xl lg:text-2xl font-bold text-primary break-words">
                          ₦{ngnCost.toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-accent/50 p-3 sm:p-4 rounded-lg mb-3 sm:mb-4 text-left w-full">
                    <h4 className="font-semibold mb-2 text-center text-sm sm:text-base">Payment Details</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1 break-words">
                      <strong>Account Number:</strong> 8130208909
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1 break-words">
                      <strong>Bank:</strong> Opay
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground break-words">
                      <strong>Account Name:</strong> Tosin Adegbola
                    </p>
                  </div>
                  
                  <Button 
                    onClick={handleCreateOrder}
                    disabled={isCreatingOrder || estimatedCost === null}
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
    </div>
  );
};