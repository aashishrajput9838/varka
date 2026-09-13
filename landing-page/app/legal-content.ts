const currentMonthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

export const termsOfService = {
  title: 'Terms of Service',
  lastUpdated: currentMonthYear,
  intro: 'Welcome to VARKA. These Terms of Service govern your access to and use of the VARKA platform, including its freight forecasting, analytics, and optimization features.',
  sections: [
    {
      num: '1',
      title: 'Acceptance of Terms',
      content: 'By creating an account or using VARKA, you agree to these Terms of Service. If you do not agree with these terms, please do not use the platform.',
    },
    {
      num: '2',
      title: 'Use of VARKA',
      content: 'VARKA provides tools designed to help freight and logistics teams analyze market conditions, forecast freight-related factors, and make informed chartering and procurement decisions.\n\nYou agree to use the platform only for lawful business purposes and not to misuse, disrupt, or attempt to gain unauthorized access to the service.',
    },
    {
      num: '3',
      title: 'Your Account',
      content: 'You are responsible for maintaining the confidentiality of your account credentials and for all activity conducted through your account.\n\nYou must provide accurate information when creating an account and notify VARKA if you believe your account has been compromised.',
    },
    {
      num: '4',
      title: 'Data and Information',
      content: 'You retain ownership of information and business data that you submit to VARKA. By using the platform, you grant VARKA the rights necessary to process that information to provide and improve the service.',
    },
    {
      num: '5',
      title: 'Forecasts and Recommendations',
      content: "VARKA's forecasts, analytics, and recommendations are provided as decision-support tools. They should not be considered guarantees of future freight rates, vessel availability, market conditions, or commercial outcomes.",
    },
    {
      num: '6',
      title: 'Intellectual Property',
      content: 'The VARKA platform, including its software, design, branding, algorithms, and content, is owned by or licensed to VARKA and is protected by applicable intellectual-property laws.',
    },
    {
      num: '7',
      title: 'Service Availability',
      content: 'We aim to keep VARKA reliable and available, but we do not guarantee uninterrupted or error-free operation.',
    },
    {
      num: '8',
      title: 'Limitation of Liability',
      content: 'To the extent permitted by law, VARKA is not responsible for indirect or consequential losses arising from the use of the platform or reliance on forecasts and recommendations.',
    },
    {
      num: '9',
      title: 'Changes to These Terms',
      content: 'We may update these Terms of Service as VARKA evolves. Updated terms will be made available through the platform.',
    },
    {
      num: '10',
      title: 'Contact',
      content: 'For questions regarding these Terms, contact us through the VARKA support or contact channel.',
    },
  ],
}

export const privacyPolicy = {
  title: 'Privacy Policy',
  lastUpdated: currentMonthYear,
  intro: 'VARKA respects your privacy and is committed to protecting the information you provide while using our platform.',
  sections: [
    {
      num: '1',
      title: 'Information We Collect',
      content: 'We may collect information such as:',
      bullets: [
        'Name and contact details',
        'Business and company information',
        'Account credentials',
        'Information submitted while using VARKA',
        'Platform usage and technical information',
      ],
    },
    {
      num: '2',
      title: 'How We Use Your Information',
      content: 'We use collected information to:',
      bullets: [
        'Provide and maintain VARKA',
        'Process your requests',
        'Improve forecasting and platform functionality',
        'Communicate with you about your account',
        'Protect the security and integrity of the platform',
        'Comply with applicable legal requirements',
      ],
    },
    {
      num: '3',
      title: 'Business Data',
      content: 'Information you submit to VARKA may include operational or commercial information related to freight, vessels, ports, routes, procurement, and logistics.\n\nWe use such information only as necessary to provide the services and operate the platform.',
    },
    {
      num: '4',
      title: 'Data Security',
      content: 'We use reasonable technical and organizational measures designed to protect your information against unauthorized access, alteration, disclosure, or loss.',
    },
    {
      num: '5',
      title: 'Data Sharing',
      content: 'We do not sell your personal information. Information may be shared with trusted service providers when necessary to operate VARKA, provide requested services, or comply with legal obligations.',
    },
    {
      num: '6',
      title: 'Cookies and Analytics',
      content: 'VARKA may use cookies or similar technologies to maintain sessions, understand platform usage, and improve the user experience.',
    },
    {
      num: '7',
      title: 'Your Rights',
      content: 'Depending on applicable law, you may have rights regarding access, correction, deletion, or restriction of the processing of your personal information.',
    },
    {
      num: '8',
      title: 'Data Retention',
      content: 'We retain information only for as long as reasonably necessary to provide our services, meet business requirements, resolve disputes, and comply with applicable laws.',
    },
    {
      num: '9',
      title: 'Policy Updates',
      content: 'This Privacy Policy may be updated from time to time. Any material changes will be reflected on this page.',
    },
    {
      num: '10',
      title: 'Contact Us',
      content: 'If you have questions about this Privacy Policy or how VARKA handles your information, please contact us through the VARKA contact channel.',
    },
  ],
}
