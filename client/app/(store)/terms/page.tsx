export const metadata = {
  title: 'Terms & Conditions | Aventura Mall Store',
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-3xl md:text-4xl font-bold mb-8">Terms & Conditions</h1>

      <div className="prose prose-slate max-w-none text-muted-foreground space-y-6">
        <p>
          Welcome to Aventura Mall Store. By accessing this website, we assume you accept these
          terms and conditions. Do not continue to use Aventura Mall Store if you do not agree to
          take all of the terms and conditions stated on this page.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
          1. Intellectual Property Rights
        </h2>
        <p>
          Other than the content you own, under these Terms, Aventura Mall Store and/or its
          licensors own all the intellectual property rights and materials contained in this
          Website. You are granted limited license only for purposes of viewing the material
          contained on this Website.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">2. Restrictions</h2>
        <p>You are specifically restricted from all of the following:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Publishing any Website material in any other media</li>
          <li>Selling, sublicensing and/or otherwise commercializing any Website material</li>
          <li>Publicly performing and/or showing any Website material</li>
          <li>Using this Website in any way that is or may be damaging to this Website</li>
          <li>Using this Website in any way that impacts user access to this Website</li>
        </ul>

        <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">3. User Content</h2>
        <p>
          In these Website Standard Terms and Conditions, "User Content" shall mean any audio, video
          text, images or other material you choose to display on this Website. By displaying Your
          Content, you grant Aventura Mall Store a non-exclusive, worldwide irrevocable, sub
          licensable license to use, reproduce, adapt, publish, translate and distribute it in any
          and all media.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">4. No warranties</h2>
        <p>
          This Website is provided "as is," with all faults, and Aventura Mall Store express no
          representations or warranties, of any kind related to this Website or the materials
          contained on this Website.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
          5. Limitation of liability
        </h2>
        <p>
          In no event shall Aventura Mall Store, nor any of its officers, directors and employees,
          shall be held liable for anything arising out of or in any way connected with your use of
          this Website whether such liability is under contract.
        </p>
      </div>
    </div>
  );
}
