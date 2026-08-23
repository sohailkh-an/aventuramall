export const metadata = {
  title: 'Privacy Policy | Aventura Mall Store',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-3xl md:text-4xl font-bold mb-8">Privacy Policy</h1>

      <div className="prose prose-slate max-w-none text-muted-foreground space-y-6">
        <p>
          At Aventura Mall Store, accessible from our website, one of our main priorities is the
          privacy of our visitors. This Privacy Policy document contains types of information that
          is collected and recorded by Aventura Mall Store and how we use it.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
          1. Information We Collect
        </h2>
        <p>
          The personal information that you are asked to provide, and the reasons why you are asked
          to provide it, will be made clear to you at the point we ask you to provide your personal
          information.
        </p>
        <p>
          If you contact us directly, we may receive additional information about you such as your
          name, email address, phone number, the contents of the message and/or attachments you may
          send us, and any other information you may choose to provide.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
          2. How We Use Your Information
        </h2>
        <p>We use the information we collect in various ways, including to:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Provide, operate, and maintain our website</li>
          <li>Improve, personalize, and expand our website</li>
          <li>Understand and analyze how you use our website</li>
          <li>Develop new products, services, features, and functionality</li>
          <li>
            Communicate with you, either directly or through one of our partners, including for
            customer service
          </li>
          <li>Process your transactions and orders</li>
          <li>Find and prevent fraud</li>
        </ul>

        <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">3. Log Files</h2>
        <p>
          Aventura Mall Store follows a standard procedure of using log files. These files log
          visitors when they visit websites. All hosting companies do this and a part of hosting
          services' analytics. The information collected by log files include internet protocol (IP)
          addresses, browser type, Internet Service Provider (ISP), date and time stamp,
          referring/exit pages, and possibly the number of clicks.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
          4. Cookies and Web Beacons
        </h2>
        <p>
          Like any other website, Aventura Mall Store uses "cookies". These cookies are used to
          store information including visitors' preferences, and the pages on the website that the
          visitor accessed or visited. The information is used to optimize the users' experience by
          customizing our web page content based on visitors' browser type and/or other information.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
          5. Third-Party Privacy Policies
        </h2>
        <p>
          Aventura Mall Store's Privacy Policy does not apply to other advertisers or websites.
          Thus, we are advising you to consult the respective Privacy Policies of these third-party
          ad servers for more detailed information. It may include their practices and instructions
          about how to opt-out of certain options.
        </p>
      </div>
    </div>
  );
}
