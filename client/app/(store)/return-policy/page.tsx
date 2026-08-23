export const metadata = {
  title: 'Return Policy | Aventura Mall Store',
};

export default function ReturnPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-3xl md:text-4xl font-bold mb-8">Return Policy</h1>

      <div className="prose prose-slate max-w-none text-muted-foreground space-y-6">
        <p>
          We want you to be completely satisfied with your purchase. If for any reason you are not
          completely satisfied, you may return the item within 30 days of receiving your order.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">1. Return Window</h2>
        <p>
          Items can be returned within 30 days of the delivery date. We cannot accept returns beyond
          this 30-day window.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
          2. Condition of Returned Items
        </h2>
        <p>
          To be eligible for a return, your item must be unused, in the same condition that you
          received it, and in its original packaging. Items that are damaged, washed, or altered
          will not be accepted.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">3. Non-Returnable Items</h2>
        <p>Certain types of items cannot be returned, including:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Gift cards</li>
          <li>Downloadable software products</li>
          <li>Some health and personal care items</li>
          <li>Perishable goods such as food, flowers, newspapers, or magazines</li>
        </ul>

        <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">4. Refunds</h2>
        <p>
          Once your return is received and inspected, we will send you an email to notify you that
          we have received your returned item. We will also notify you of the approval or rejection
          of your refund. If approved, your refund will be processed, and a credit will
          automatically be applied to your credit card or original method of payment within 5-10
          business days.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
          5. Shipping Costs for Returns
        </h2>
        <p>
          You will be responsible for paying for your own shipping costs for returning your item
          unless the return is a result of our error (you received an incorrect or defective item,
          etc.). Shipping costs are non-refundable.
        </p>
      </div>
    </div>
  );
}
