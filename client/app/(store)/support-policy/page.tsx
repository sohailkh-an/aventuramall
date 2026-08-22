export const metadata = {
  title: 'Support Policy | Galleria Mall Store',
};

export default function SupportPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-3xl md:text-4xl font-bold mb-8">Support Policy</h1>
      
      <div className="prose prose-slate max-w-none text-muted-foreground space-y-6">
        <p>
          At Galleria Mall Store, we are committed to providing you with the best possible customer experience. 
          Our support team is here to assist you with any questions, concerns, or technical issues you may encounter.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">1. Support Channels</h2>
        <p>You can reach our support team through the following channels:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Email:</strong> customercare@apexmall-store.com (Response within 24 hours)</li>
          <li><strong>Phone:</strong> +1 (555) 000-0000 (Available Mon-Fri, 9am - 6pm EST)</li>
          <li><strong>Live Chat:</strong> Available on our website during business hours.</li>
        </ul>

        <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">2. Response Times</h2>
        <p>
          We strive to respond to all inquiries as quickly as possible. For emails and support tickets, you can expect 
          a response within 24 hours during normal business days. Live chat and phone support offer immediate assistance 
          during our operating hours.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">3. What We Support</h2>
        <p>Our support team is happy to help you with:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Order status and tracking</li>
          <li>Returns and exchanges</li>
          <li>Product inquiries and specifications</li>
          <li>Account management issues</li>
          <li>Payment and billing questions</li>
          <li>Technical issues with the website</li>
        </ul>

        <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">4. Self-Service Resources</h2>
        <p>
          Before contacting support, we encourage you to review our Frequently Asked Questions (FAQ) section, 
          Return Policy, and Shipping Policy, as many common questions are answered there.
        </p>
      </div>
    </div>
  );
}
