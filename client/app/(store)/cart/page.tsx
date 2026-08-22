"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useCart } from "@/hooks/use-cart";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Trash2, Plus, Minus, ShoppingBag, ArrowLeft, ArrowRight,
  CreditCard, ShoppingCart, Map, Truck, CheckCircle
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Country, State, City } from "country-state-city";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import { useCurrency } from "@/hooks/use-currency";

const STEPS = [
  { id: 1, title: "My Cart", icon: ShoppingCart },
  { id: 2, title: "Shipping info", icon: Map },
  { id: 3, title: "Delivery info", icon: Truck },
  { id: 4, title: "Payment", icon: CreditCard },
  { id: 5, title: "Confirmation", icon: CheckCircle },
];

const PAYMENT_METHODS = [
  { id: "paypal", title: "Paypal", logo: "https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" },
  { id: "cod", title: "Cash on Delivery", logo: "https://cdn-icons-png.flaticon.com/512/1554/1554406.png" },
  { id: "usdt", title: "Usdt-ERC 20", logo: "https://cryptologos.cc/logos/tether-usdt-logo.png" },
  { id: "eth", title: "ETH", logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png" },
  { id: "btc", title: "BTC", logo: "https://cryptologos.cc/logos/bitcoin-btc-logo.png" },
];

const DELIVERY_OPTIONS = [
  { id: "Home Delivery", time: "3-5 Business Days", price: 0 },
  { id: "Express Delivery", time: "1-2 Business Days", price: 15 },
];

const ALL_COUNTRIES = Country.getAllCountries();

type Address = {
  id: string;
  label?: string;
  street: string;
  city: string;
  state: string;
  zip?: string;
  country: string;
  phone?: string;
};

type UserData = {
  name?: string;
  email?: string;
  walletBalance?: string | number;
  hasTransactionPassword?: boolean;
};

type OrderItem = {
  id: string;
  product?: {
    name?: string;
  };
  quantity: number;
  price: string | number;
};

type OrderResult = {
  id: string;
  createdAt: string;
  total: string | number;
  paymentMethod?: string;
  deliveryType?: string;
  user?: {
    name?: string;
    email?: string;
  };
  shippingAddress?: {
    street?: string;
    city?: string;
    country?: string;
  };
  items: OrderItem[];
};

type ApiError = {
  response?: {
    data?: {
      error?: string;
    };
  };
  message?: string;
};

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, cartTotal, cartCount, clearCart } = useCart();
  const { formatPrice } = useCurrency();
  const [currentStep, setCurrentStep] = useState(1);

  // Address State
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("new");

  const [countries] = useState(() => ALL_COUNTRIES);
  const [states, setStates] = useState<ReturnType<typeof State.getStatesOfCountry>>([]);
  const [cities, setCities] = useState<ReturnType<typeof City.getCitiesOfState>>([]);

  const [formData, setFormData] = useState({
    country: "",
    state: "",
    city: "",
    street: "",
    zip: "",
    phone: "",
  });

  // Delivery State
  const [deliveryType, setDeliveryType] = useState("Home Delivery");

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [cryptoAddress, setCryptoAddress] = useState("");
  const [walletBalance, setWalletBalance] = useState("0.00");
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");

  // Transaction Password State
  const [hasTransactionPassword, setHasTransactionPassword] = useState<boolean>(false);
  const [transactionPassword, setTransactionPassword] = useState("");
  const [newTransactionPassword, setNewTransactionPassword] = useState("");
  const [confirmTransactionPassword, setConfirmTransactionPassword] = useState("");

  // Order Result
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUserData = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/users/me') as { data: UserData };
      setWalletBalance(String(res.data.walletBalance || "0.00"));
      setUserEmail(res.data.email || "");
      setUserName(res.data.name || "");
      setHasTransactionPassword(Boolean(res.data.hasTransactionPassword));

      const addrRes = await apiClient.get('/api/users/me/addresses') as { data: Address[] };
      if (addrRes.data && addrRes.data.length > 0) {
        setAddresses(addrRes.data);
        setSelectedAddressId(addrRes.data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Load Initial Data
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchUserData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchUserData]);

  const handleCountryChange = (countryCode: string | null) => {
    if (!countryCode) return;
    setFormData({ ...formData, country: countryCode, state: "", city: "" });
    setStates(State.getStatesOfCountry(countryCode));
    setCities([]);
  };

  const handleStateChange = (stateCode: string | null) => {
    if (!stateCode) return;
    setFormData({ ...formData, state: stateCode, city: "" });
    setCities(City.getCitiesOfState(formData.country, stateCode));
  };

  const handleNextStep = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const handleCreateOrder = async () => {
    setIsSubmitting(true);
    try {
      // Transaction Password Logic
      if (hasTransactionPassword) {
        if (!transactionPassword) throw new Error("Please enter your transaction password.");
        await apiClient.post('/api/users/me/transaction-password/verify', { password: transactionPassword });
      } else {
        if (!newTransactionPassword) throw new Error("Please set a transaction password.");
        if (newTransactionPassword !== confirmTransactionPassword) throw new Error("Passwords do not match.");
        if (newTransactionPassword.length < 6) throw new Error("Transaction password must be at least 6 characters.");
        await apiClient.put('/api/users/me/transaction-password', { newPassword: newTransactionPassword });
        setHasTransactionPassword(true);
      }

      let finalAddressId = selectedAddressId;

      // If new address, save it first
      if (selectedAddressId === "new") {
        const countryName = Country.getCountryByCode(formData.country)?.name || formData.country;
        const stateName = State.getStateByCodeAndCountry(formData.state, formData.country)?.name || formData.state;

        const res = await apiClient.post('/api/users/me/addresses', {
          label: "Home",
          street: formData.street,
          city: formData.city,
          state: stateName,
          zip: formData.zip,
          country: countryName,
          phone: formData.phone,
        }) as { data: Address };
        finalAddressId = res.data.id;
      }

      // Create Order
      const items = cartItems.map(item => ({
        productId: item.id,
        quantity: item.quantity
      }));

      const orderRes = await apiClient.post('/api/orders', {
        shippingAddressId: finalAddressId,
        items,
        paymentMethod,
        deliveryType
      }) as { data: OrderResult };

      setOrderResult(orderRes.data);
      clearCart();
      setCurrentStep(5);
    } catch (e: unknown) {
      console.error("Failed to create order", e);
      const error = e as ApiError;
      toast.error(error.response?.data?.error || error.message || "Failed to create order. Please check your inputs or login status.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // Render Steps
  // -------------------------------------------------------------

  if (cartItems.length === 0 && currentStep === 1) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
        <div className="bg-muted p-6 rounded-full mb-6 text-muted-foreground">
          <ShoppingBag className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Your Shopping Cart is Empty</h1>
        <p className="text-muted-foreground max-w-md mb-8">
          Looks like you haven&apos;t added anything to your cart yet. Explore our top products and start shopping!
        </p>
        <Link href="/" className={cn(buttonVariants({ variant: "default" }), "bg-brand hover:bg-brand/90")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Continue Shopping
        </Link>
      </div>
    );
  }

  const renderStepper = () => (
    <div className="-mx-4 mb-8 flex items-center justify-start overflow-x-auto px-4 pb-4 md:mx-0 md:mb-10 md:justify-center md:px-0">
      {STEPS.map((step, index) => {
        const isActive = currentStep === step.id;
        const isPassed = currentStep > step.id;
        return (
          <React.Fragment key={step.id}>
            <div className="mx-2 flex min-w-[74px] flex-col items-center md:mx-4 md:min-w-[80px]">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors",
                isActive ? "text-brand" : isPassed ? "text-green-500" : "text-foreground"
              )}>
                <step.icon className="w-6 h-6" />
              </div>
              <span className={cn(
                "text-xs text-foreground font-medium whitespace-nowrap md:text-sm",
                isActive ? "text-brand font-bold" : isPassed ? "text-green-500" : "text-foreground"
              )}>
                {step.id}. {step.title}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <ArrowRight className="mx-1 h-4 w-4 shrink-0 text-foreground md:mx-2" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  const renderSummaryBox = () => (
    <Card className="sticky top-24 max-w-full shadow-sm bg-dull text-foreground border-0">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Summary</h2>
          <span className="bg-brand text-white text-xs px-2 py-1 rounded font-bold">{cartCount} Items</span>
        </div>
        <div className="space-y-4 text-sm">
          <div className="flex justify-between font-bold border-b pb-2">
            <span>Product</span>
            <span>Total</span>
          </div>
          {cartItems.map(item => (
            <div key={item.id} className="flex min-w-0 justify-between gap-3 border-b border-dashed pb-2">
              <span className="min-w-0 text-foreground line-clamp-1">{item.name} × {item.quantity}</span>
              <span className="font-medium whitespace-nowrap">{formatPrice(Number(item.price) * item.quantity)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2">
            <span className="text-foreground font-medium">Subtotal</span>
            <span className="font-bold">{formatPrice(Number(cartTotal))}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground font-medium">Tax</span>
            <span className="font-bold">{formatPrice(0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground font-medium">Total Shipping</span>
            <span className="font-bold">{formatPrice(0)}</span>
          </div>
          <div className="flex justify-between border-t pt-4">
            <span className="font-bold text-lg">Total</span>
            <span className="font-bold text-lg">{formatPrice(Number(cartTotal))}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-background py-6 md:py-12">
      <div className="container mx-auto max-w-6xl px-4">
        {renderStepper()}

        <div className="grid min-w-0 gap-6 lg:grid-cols-3 lg:gap-8">
          {/* Main Content Area */}
          <div className={cn("min-w-0 space-y-6", currentStep === 5 ? "lg:col-span-3" : "lg:col-span-2")}>

            {/* STEP 1: CART */}
            {currentStep === 1 && (
              <Card className="max-w-full overflow-hidden bg-dull border-0 text-foreground py-0 shadow-sm">
                <CardContent className="p-0">
                  <div className="divide-y divide-border md:hidden">
                    {cartItems.map((item) => (
                      <div key={item.id} className="space-y-4 p-4">
                        <div className="flex min-w-0 gap-3">
                          <img
                            src={item.images[0]}
                            alt={item.name}
                            className="h-20 w-20 shrink-0 rounded-md object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <h3 className="line-clamp-2 text-sm font-bold leading-snug">{item.name}</h3>
                            <p className="mt-2 text-xs font-medium text-muted-foreground">Tax: {formatPrice(0)}</p>
                            <p className="mt-1 text-base font-bold text-brand">{formatPrice(Number(item.price))}</p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-red-500 transition-colors hover:bg-red-50"
                            aria-label={`Remove ${item.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 rounded-full bg-muted/40 px-2 py-1">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="p-2 hover:text-brand"
                              aria-label={`Decrease ${item.name} quantity`}
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="p-2 hover:text-brand"
                              aria-label={`Increase ${item.name} quantity`}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Total</p>
                            <p className="text-lg font-black text-brand">{formatPrice(Number(item.price) * item.quantity)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs uppercase bg-muted/10 border-b">
                        <tr>
                          <th className="px-6 py-4 font-bold">Product</th>
                          <th className="px-6 py-4 font-bold">Price</th>
                          <th className="px-6 py-4 font-bold">Tax</th>
                          <th className="px-6 py-4 font-bold text-center">Quantity</th>
                          <th className="px-6 py-4 font-bold">Total</th>
                          <th className="px-6 py-4 font-bold text-center">Remove</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cartItems.map((item) => (
                          <tr key={item.id} className="border-b last:border-b-0">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-4">
                                <img src={item.images[0]} alt={item.name} className="w-16 h-16 object-cover rounded-md" />
                                <span className="font-medium max-w-[200px] line-clamp-2">{item.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-bold">{formatPrice(Number(item.price))}</td>
                            <td className="px-6 py-4 font-medium">{formatPrice(0)}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-2 bg-muted/30 rounded-full px-2 py-1 w-max mx-auto">
                                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 hover:text-brand"><Minus className="w-3 h-3" /></button>
                                <span className="font-bold w-4 text-center text-xs">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 hover:text-brand"><Plus className="w-3 h-3" /></button>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-bold text-brand">{formatPrice(Number(item.price) * item.quantity)}</td>
                            <td className="px-6 py-4 text-center">
                              <button onClick={() => removeFromCart(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors">
                                <Trash2 className="w-4 h-4 mx-auto" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex flex-col gap-4 border-t bg-muted/10 p-4 sm:flex-row sm:items-center sm:justify-between md:p-6">
                    <Link href="/" className="flex items-center text-sm font-medium text-brand hover:underline">
                      <ArrowLeft className="w-4 h-4 mr-2" /> Return to shop
                    </Link>
                    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
                      <div className="flex items-center justify-between sm:mr-4 sm:block sm:text-right">
                        <span className="text-muted-foreground mr-2">Subtotal</span>
                        <span className="font-bold text-lg">{formatPrice(Number(cartTotal))}</span>
                      </div>
                      <Button onClick={handleNextStep} className="w-full bg-brand hover:bg-brand/90 font-bold sm:w-auto sm:px-8">Continue to Shipping</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* STEP 2: SHIPPING INFO */}
            {currentStep === 2 && (
              <Card className="bg-dull text-foreground border-0 rounded-sm shadow-sm">
                <CardContent className="p-6 space-y-6">
                  <h2 className="text-xl font-bold">Shipping Address</h2>

                  {addresses.length > 0 && (
                    <div className="space-y-3 mb-6">
                      <Label>Select Saved Address</Label>
                      <RadioGroup value={selectedAddressId} onValueChange={(val) => val && setSelectedAddressId(val)} className="grid gap-3">
                        {addresses.map(addr => (
                          <div key={addr.id} className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-muted/30">
                            <RadioGroupItem value={addr.id} id={addr.id} />
                            <Label htmlFor={addr.id} className="cursor-pointer flex-1 font-medium">
                              {addr.label} - {addr.street}, {addr.city}, {addr.state}, {addr.country}
                            </Label>
                          </div>
                        ))}
                        <div className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-muted/30">
                          <RadioGroupItem value="new" id="new" />
                          <Label htmlFor="new" className="cursor-pointer flex-1 font-medium text-brand">
                            + Add New Address
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}

                  {selectedAddressId === "new" && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Country</Label>
                        <Select value={formData.country} onValueChange={handleCountryChange}>
                          <SelectTrigger><SelectValue placeholder="Select Country" /></SelectTrigger>
                          <SelectContent>
                            {countries.map(c => <SelectItem key={c.isoCode} value={c.isoCode}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>State/Province</Label>
                        <Select value={formData.state} onValueChange={handleStateChange} disabled={!formData.country}>
                          <SelectTrigger><SelectValue placeholder="Select State" /></SelectTrigger>
                          <SelectContent>
                            {states.map(s => <SelectItem key={s.isoCode} value={s.isoCode}>{s.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>City</Label>
                        {cities.length > 0 ? (
                          <Select value={formData.city} onValueChange={val => setFormData({ ...formData, city: val || "" })} disabled={!formData.state}>
                            <SelectTrigger><SelectValue placeholder="Select City" /></SelectTrigger>
                            <SelectContent>
                              {cities.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input placeholder="Enter City" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} disabled={!formData.state} />
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Postal Code</Label>
                        <Input placeholder="Enter Postal Code" value={formData.zip} onChange={e => setFormData({ ...formData, zip: e.target.value })} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Street Address</Label>
                        <Textarea placeholder="Enter Street Address" value={formData.street} onChange={e => setFormData({ ...formData, street: e.target.value })} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Phone Number</Label>
                        <Input placeholder="Enter Phone Number" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={() => setCurrentStep(1)}>Back</Button>
                    <Button onClick={handleNextStep} className="bg-brand hover:bg-brand/90 font-bold" disabled={selectedAddressId === "new" && (!formData.country || !formData.state || !formData.city || !formData.street || !formData.zip || !formData.phone)}>
                      Continue to Delivery
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* STEP 3: DELIVERY INFO */}
            {currentStep === 3 && (
              <Card className="bg-dull text-foreground rounded-sm border-0 shadow-sm">
                <CardContent className="p-6 space-y-6">
                  <h2 className="text-xl font-bold">Select Delivery Option</h2>
                  <RadioGroup value={deliveryType} onValueChange={(val) => val && setDeliveryType(val)} className="grid md:grid-cols-2 gap-4">
                    {DELIVERY_OPTIONS.map(type => (
                      <div key={type.id} className={cn("border-2 rounded-xl p-4 cursor-pointer flex items-start space-x-4 transition-colors", deliveryType === type.id ? "border-brand bg-brand/5" : "border-muted hover:border-brand/50")}>
                        <RadioGroupItem value={type.id} id={type.id} className="mt-1" />
                        <Label htmlFor={type.id} className="cursor-pointer flex-1">
                          <div className="font-bold text-lg">{type.id}</div>
                          <div className="text-muted-foreground text-sm mt-1">{type.time}</div>
                          <div className="font-bold text-brand mt-2">{type.price === 0 ? "Free" : formatPrice(type.price)}</div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={() => setCurrentStep(2)}>Back</Button>
                    <Button onClick={handleNextStep} className="bg-brand hover:bg-brand/90 font-bold">Continue to Payment</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* STEP 4: PAYMENT */}
            {currentStep === 4 && (
              <Card className="bg-dull text-foreground rounded-sm border-0 shadow-sm">
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-base font-bold">Any additional info?</Label>
                    <Textarea
                      placeholder="Type your text"
                      className="min-h-[100px] resize-none"
                      value={additionalInfo}
                      onChange={e => setAdditionalInfo(e.target.value)}
                    />
                  </div>

                  <div className="space-y-4">
                    <Label className="text-base font-bold">Select a payment option</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {PAYMENT_METHODS.map(method => (
                        <div
                          key={method.id}
                          onClick={() => setPaymentMethod(method.id)}
                          className={cn(
                            "border rounded-xl p-4 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all h-32 relative",
                            paymentMethod === method.id ? "border-brand ring-1 ring-brand bg-brand/5" : "hover:border-brand/50"
                          )}
                        >
                          {method.id === 'usdt' && <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full" />}
                          <div className="h-12 flex items-center justify-center">
                            {method.id === 'cod' ? (
                              <div className="bg-orange-400 p-2 rounded-md"><Truck className="w-8 h-8 text-white" /></div>
                            ) : method.id === 'paypal' ? (
                              <div className="bg-[#003087] p-2 rounded-md text-white font-bold italic text-xl px-4">PayPal</div>
                            ) : (
                              <img src={method.logo} alt={method.title} className="w-12 h-12 object-contain" />
                            )}
                          </div>
                          <span className="font-bold text-sm text-center">{method.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {['usdt', 'eth', 'btc'].includes(paymentMethod) && (
                    <div className="pt-4 space-y-6 animate-in fade-in zoom-in duration-300">
                      <Input
                        placeholder="Enter your transaction hash or wallet address"
                        value={cryptoAddress}
                        onChange={e => setCryptoAddress(e.target.value)}
                        className="font-mono text-sm"
                      />
                      <div className="text-center space-y-3">
                        <div className="text-sm font-medium">Your wallet balance : <span className="font-bold">{formatPrice(Number(walletBalance))}</span></div>
                        {Number(walletBalance) < Number(cartTotal) ? (
                          <div className="bg-slate-400 text-white font-bold py-2 px-6 rounded-md inline-block">Insufficient balance</div>
                        ) : (
                          <div className="bg-green-500 text-white font-bold py-2 px-6 rounded-md inline-block">Sufficient balance</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Transaction Password Section */}
                  <div className="pt-6 border-t mt-6 space-y-4">
                    <Label className="text-base font-bold">Transaction Password</Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      {hasTransactionPassword 
                        ? "Please enter your transaction password to confirm this order." 
                        : "You need to set a transaction password before placing your first order. This will be used for future purchases."}
                    </p>
                    
                    {hasTransactionPassword ? (
                      <div className="space-y-2 max-w-sm">
                        <Label>Transaction Password</Label>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          value={transactionPassword}
                          onChange={(e) => setTransactionPassword(e.target.value)}
                        />
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-4 max-w-2xl">
                        <div className="space-y-2">
                          <Label>New Transaction Password</Label>
                          <Input 
                            type="password" 
                            placeholder="••••••••" 
                            value={newTransactionPassword}
                            onChange={(e) => setNewTransactionPassword(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Confirm Password</Label>
                          <Input 
                            type="password" 
                            placeholder="••••••••" 
                            value={confirmTransactionPassword}
                            onChange={(e) => setConfirmTransactionPassword(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between pt-6 border-t mt-6">
                    <Button variant="outline" onClick={() => setCurrentStep(3)}>Back</Button>
                    <Button
                      onClick={handleCreateOrder}
                      disabled={isSubmitting || (['usdt', 'eth', 'btc'].includes(paymentMethod) && Number(walletBalance) < Number(cartTotal))}
                      className="bg-brand hover:bg-brand/90 font-bold px-8"
                    >
                      {isSubmitting ? "Processing..." : "Complete Order"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* STEP 5: CONFIRMATION */}
            {currentStep === 5 && orderResult && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500 max-w-4xl mx-auto">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h1 className="text-3xl font-bold text-foreground">Thank You for Your Order!</h1>
                  <p className="text-muted-foreground italic">A copy of your order summary has been sent to {userEmail}</p>
                </div>

                <Card className="border-0 py-0 rounded-sm overflow-hidden">
                  <div className="bg-dull text-foreground p-6">
                    <h3 className="font-bold text-lg mb-4">Order Summary</h3>
                    <div className="grid md:grid-cols-2 gap-x-12 gap-y-4 text-sm">
                      <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground font-medium">Order date:</span><span className="font-bold">{new Date(orderResult.createdAt).toLocaleString()}</span></div>
                      <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground font-medium">Order status:</span><span className="font-bold">Pending</span></div>
                      <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground font-medium">Name:</span><span className="font-bold">{orderResult.user?.name || userName}</span></div>
                      <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground font-medium">Total order amount:</span><span className="font-bold">{formatPrice(Number(orderResult.total))}</span></div>
                      <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground font-medium">Email:</span><span className="font-bold">{orderResult.user?.email || userEmail}</span></div>
                      <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground font-medium">Shipping:</span><span className="font-bold">{orderResult.deliveryType || 'Flat shipping rate'}</span></div>
                      <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground font-medium">Shipping address:</span><span className="font-bold text-right pl-4 line-clamp-2">{orderResult.shippingAddress?.street}, {orderResult.shippingAddress?.city}, {orderResult.shippingAddress?.country}</span></div>
                      <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground font-medium">Payment method:</span><span className="font-bold uppercase">{orderResult.paymentMethod || 'COD'}</span></div>
                    </div>
                  </div>
                </Card>

                <Card className="border-0 py-0 shadow-sm overflow-hidden">
                  <div className="bg-dull text-foreground p-6">
                    <div className="text-center mb-6">
                      <span className="text-lg">Order Code: </span>
                      <span className="text-xl font-bold text-brand uppercase">{orderResult.id.slice(-12)}</span>
                    </div>

                    <h3 className="font-bold text-lg mb-4">Order Details</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs font-bold border-b bg-muted/20">
                          <tr>
                            <th className="py-3 px-2">#</th>
                            <th className="py-3 px-2">Product</th>
                            <th className="py-3 px-2">Variation</th>
                            <th className="py-3 px-2">Quantity</th>
                            <th className="py-3 px-2">Delivery Type</th>
                            <th className="py-3 px-2 text-right">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orderResult.items.map((item, i) => (
                            <tr key={item.id} className="border-b last:border-b-0">
                              <td className="py-4 px-2 text-muted-foreground">{i + 1}</td>
                              <td className="py-4 px-2 font-medium max-w-[200px] line-clamp-2">{item.product?.name}</td>
                              <td className="py-4 px-2 text-muted-foreground">-</td>
                              <td className="py-4 px-2">{item.quantity}</td>
                              <td className="py-4 px-2 text-muted-foreground">{orderResult.deliveryType || 'Home Delivery'}</td>
                              <td className="py-4 px-2 text-right font-bold">{formatPrice(Number(item.price) * item.quantity)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-6 border-t pt-4 ml-auto w-full md:w-1/2 lg:w-1/3">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground font-medium">Subtotal</span><span className="font-bold">{formatPrice(Number(orderResult.total))}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground font-medium">Shipping</span><span className="font-bold">{formatPrice(0)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground font-medium">Tax</span><span className="font-bold">{formatPrice(0)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground font-medium">Coupon Discount</span><span className="font-bold">{formatPrice(0)}</span></div>
                        <div className="flex justify-between border-t pt-2 mt-2"><span className="font-bold text-base">Total</span><span className="font-bold text-base">{formatPrice(Number(orderResult.total))}</span></div>
                      </div>
                    </div>
                  </div>
                </Card>

                <div className="text-center mt-8">
                  <Link href="/" className={cn(buttonVariants({ variant: "default" }), "bg-brand hover:bg-brand/90 font-bold px-8")}>
                    Continue Shopping
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Summary (Visible on steps 1-4) */}
          {currentStep < 5 && (
            <div className="min-w-0 lg:col-span-1">
              {renderSummaryBox()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
