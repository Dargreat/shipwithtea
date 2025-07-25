import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Upload,
  Download,
  DollarSign,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

export const PricingManagement = () => {
  const [pricingData, setPricingData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPrice, setEditingPrice] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    from_country: '',
    to_country: '',
    package_type: '',
    base_price: '',
    price_per_kg: '',
    naira_base_price: '',
    naira_price_per_kg: '',
  });

  const [packageTypes, setPackageTypes] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);

  useEffect(() => {
    fetchPricingData();
    loadDropdownOptions();
    
    // Set up real-time listener for pricing changes
    const channel = supabase
      .channel('pricing-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pricing'
        },
        () => {
          fetchPricingData();
          loadDropdownOptions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadDropdownOptions = async () => {
    try {
      const { data: pricing, error } = await supabase
        .from('pricing')
        .select('from_country, to_country, package_type');

      if (error) {
        console.error('Error loading dropdown options:', error);
        return;
      }

      if (pricing) {
        // Extract unique countries
        const fromCountries = pricing.map(p => p.from_country);
        const toCountries = pricing.map(p => p.to_country);
        const allCountries = [...new Set([...fromCountries, ...toCountries])];
        setCountries(allCountries.sort());

        // Extract unique package types
        const packageTypesList = [...new Set(pricing.map(p => p.package_type))];
        setPackageTypes(packageTypesList.sort());
      }
    } catch (error) {
      console.error('Error loading dropdown options:', error);
    }
  };

  const fetchPricingData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('pricing')
        .select('*')
        .order('from_country', { ascending: true });

      if (error) {
        console.error('Error fetching pricing data:', error);
        toast({
          title: "Error Loading Pricing",
          description: "Unable to load pricing data. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setPricingData(data || []);
    } catch (error) {
      console.error('Error fetching pricing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.from_country || !formData.to_country || !formData.package_type || !formData.price_per_kg) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (including USD price per kg).",
        variant: "destructive",
      });
      return;
    }

    try {
      const priceData = {
        ...formData,
        base_price: parseFloat(formData.base_price) || 0,
        price_per_kg: parseFloat(formData.price_per_kg),
        naira_base_price: formData.naira_base_price ? parseFloat(formData.naira_base_price) : null,
        naira_price_per_kg: formData.naira_price_per_kg ? parseFloat(formData.naira_price_per_kg) : null,
      };

      let error;
      if (editingPrice) {
        const { error: updateError } = await supabase
          .from('pricing')
          .update(priceData)
          .eq('id', editingPrice.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('pricing')
          .insert([priceData]);
        error = insertError;
      }

      if (error) {
        console.error('Error saving pricing:', error);
        toast({
          title: "Save Failed",
          description: "Unable to save pricing data. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: editingPrice ? "Pricing Updated" : "Pricing Created",
        description: `Pricing ${editingPrice ? 'updated' : 'created'} successfully.`,
      });

      resetForm();
      fetchPricingData();
    } catch (error) {
      console.error('Error saving pricing:', error);
    }
  };

  const handleEdit = (price: any) => {
    setEditingPrice(price);
    setFormData({
      from_country: price.from_country,
      to_country: price.to_country,
      package_type: price.package_type,
      base_price: price.base_price?.toString() || '0',
      price_per_kg: price.price_per_kg.toString(),
      naira_base_price: price.naira_base_price?.toString() || '',
      naira_price_per_kg: price.naira_price_per_kg?.toString() || '',
    });
    setIsEditing(true);
  };

  const handleDelete = async (priceId: string) => {
    if (!confirm('Are you sure you want to delete this pricing rule?')) return;

    try {
      const { error } = await supabase
        .from('pricing')
        .delete()
        .eq('id', priceId);

      if (error) {
        console.error('Error deleting pricing:', error);
        toast({
          title: "Delete Failed",
          description: "Unable to delete pricing rule. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Pricing Deleted",
        description: "Pricing rule deleted successfully.",
      });

      fetchPricingData();
    } catch (error) {
      console.error('Error deleting pricing:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      from_country: '',
      to_country: '',
      package_type: '',
      base_price: '',
      price_per_kg: '',
      naira_base_price: '',
      naira_price_per_kg: '',
    });
    setEditingPrice(null);
    setIsEditing(false);
  };

  const exportToCsv = () => {
    const csvContent = [
      ['From Country', 'To Country', 'Package Type', 'USD Base Price', 'USD Price per KG', 'NGN Base Price', 'NGN Price per KG'],
      ...pricingData.map(price => [
        price.from_country,
        price.to_country,
        price.package_type,
        price.base_price || 0,
        price.price_per_kg,
        price.naira_base_price || '',
        price.naira_price_per_kg || ''
      ])
    ];

    const csvString = csvContent.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pricing_data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an Excel file (.xlsx or .xls)",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Skip header row and process data
      const rows = jsonData.slice(1) as any[][];
      const validRows = [];
      const errors = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 4) continue;

        const [from_country, to_country, package_type, base_price, price_per_kg, naira_base_price, naira_price_per_kg] = row;
        
        if (!from_country || !to_country || !package_type || !price_per_kg) {
          errors.push(`Row ${i + 2}: Missing required fields`);
          continue;
        }

        const parsedBasePrice = parseFloat(base_price) || 0;
        const parsedPricePerKg = parseFloat(price_per_kg);
        const parsedNairaBasePrice = naira_base_price ? parseFloat(naira_base_price) : null;
        const parsedNairaPricePerKg = naira_price_per_kg ? parseFloat(naira_price_per_kg) : null;

        if (isNaN(parsedPricePerKg) || parsedPricePerKg <= 0) {
          errors.push(`Row ${i + 2}: Invalid USD price per kg`);
          continue;
        }

        validRows.push({
          from_country: String(from_country).trim(),
          to_country: String(to_country).trim(),
          package_type: String(package_type).trim(),
          base_price: parsedBasePrice,
          price_per_kg: parsedPricePerKg,
          naira_base_price: parsedNairaBasePrice,
          naira_price_per_kg: parsedNairaPricePerKg,
        });
      }

      if (errors.length > 0) {
        toast({
          title: "Upload Errors",
          description: `${errors.length} rows had errors and were skipped.`,
          variant: "destructive",
        });
      }

      if (validRows.length === 0) {
        toast({
          title: "No Valid Data",
          description: "No valid pricing data found in the Excel file.",
          variant: "destructive",
        });
        return;
      }

      // Clear existing pricing data and insert new data
      const { error: deleteError } = await supabase
        .from('pricing')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

      if (deleteError) {
        console.error('Error clearing existing pricing:', deleteError);
        toast({
          title: "Upload Failed",
          description: "Failed to clear existing pricing data.",
          variant: "destructive",
        });
        return;
      }

      const { error: insertError } = await supabase
        .from('pricing')
        .insert(validRows);

      if (insertError) {
        console.error('Error inserting pricing data:', insertError);
        toast({
          title: "Upload Failed",
          description: "Failed to upload pricing data.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Upload Successful",
        description: `${validRows.length} pricing rules uploaded successfully.`,
      });

      fetchPricingData();
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Upload Failed",
        description: "Error processing the Excel file.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading pricing data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Excel Upload Section */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            <span>Excel File Upload</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Upload an Excel file (.xlsx or .xls) with columns: From Country, To Country, Package Type, USD Base Price, USD Price per KG, NGN Base Price (optional), NGN Price per KG (optional).
                This will replace all existing pricing data.
              </AlertDescription>
            </Alert>
            
            <div className="flex items-center space-x-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Upload Excel File'}
              </Button>
              <span className="text-sm text-muted-foreground">
                Supported formats: .xlsx, .xls
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Form */}
      {isEditing && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span>{editingPrice ? 'Edit Pricing Rule' : 'Create New Pricing Rule'}</span>
              </div>
              <Button variant="outline" onClick={resetForm}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="from_country">From Country *</Label>
                  <Select
                    value={formData.from_country}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, from_country: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select origin country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map(country => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="to_country">To Country *</Label>
                  <Select
                    value={formData.to_country}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, to_country: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map(country => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="package_type">Package Type *</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.package_type}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, package_type: value }))}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select existing package type" />
                      </SelectTrigger>
                      <SelectContent>
                        {packageTypes.map(type => (
                          <SelectItem key={type} value={type}>
                            {type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-muted-foreground self-center">OR</span>
                    <Input
                      placeholder="Enter new package type"
                      value={formData.package_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, package_type: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Select from existing types or type a new package type</p>
                </div>

                {/* USD Pricing */}
                <div className="border rounded-lg p-4 space-y-4">
                  <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    USD Pricing
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="base_price">Base Price (USD)</Label>
                      <Input
                        id="base_price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.base_price}
                        onChange={(e) => setFormData(prev => ({ ...prev, base_price: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price_per_kg">Price per KG (USD) *</Label>
                      <Input
                        id="price_per_kg"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price_per_kg}
                        onChange={(e) => setFormData(prev => ({ ...prev, price_per_kg: e.target.value }))}
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* NGN Pricing */}
                <div className="border rounded-lg p-4 space-y-4">
                  <h4 className="text-lg font-semibold text-foreground">₦ NGN Pricing (Optional)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="naira_base_price">Base Price (NGN)</Label>
                      <Input
                        id="naira_base_price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.naira_base_price}
                        onChange={(e) => setFormData(prev => ({ ...prev, naira_base_price: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="naira_price_per_kg">Price per KG (NGN)</Label>
                      <Input
                        id="naira_price_per_kg"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.naira_price_per_kg}
                        onChange={(e) => setFormData(prev => ({ ...prev, naira_price_per_kg: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" variant="default">
                  <Save className="h-4 w-4 mr-1" />
                  {editingPrice ? 'Update Rule' : 'Create Rule'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Pricing Rules List */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span>Pricing Rules</span>
            </div>
            <div className="flex space-x-2">
              {pricingData.length > 0 && (
                <Button variant="outline" onClick={exportToCsv}>
                  <Download className="h-4 w-4 mr-1" />
                  Export CSV
                </Button>
              )}
              <Button variant="default" onClick={() => setIsEditing(true)}>
                <Plus className="h-4 w-4 mr-1" />
                New Rule
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pricingData.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No pricing rules created yet</p>
              <Button variant="default" onClick={() => setIsEditing(true)}>
                Create Your First Rule
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {pricingData.map((price) => (
                <div
                  key={price.id}
                  className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-smooth"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-4">
                        <h3 className="font-semibold text-foreground">
                          {price.from_country} → {price.to_country}
                        </h3>
                        <span className="text-sm bg-accent px-2 py-1 rounded">
                          {price.package_type}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <DollarSign className="h-3 w-3" />
                          <span>Base: ${price.base_price || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="h-3 w-3" />
                          <span>Per KG: ${price.price_per_kg}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(price)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(price.id)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};