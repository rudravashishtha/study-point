// Static fallback values — most consumers now use database-driven
// SiteSettings. This module only serves root layout metadata and SEO
// fallbacks that must be resolvable at build/static-export time.
export const siteConfig = {
  name: "Study Point",
  description:
    "A trusted coaching institute for Classes IX-XII, focused on structured learning, personal guidance, and steady academic growth.",
  contact: {
    email: "hello@studypoint.example.com",
    phone: "+91 00000 00000",
  },
  links: {
    twitter: "https://twitter.com/studypoint",
    github: "https://github.com/studypoint",
  },
};
