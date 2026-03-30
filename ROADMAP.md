# Pour the Occasion — Product Roadmap

---

## 1. Proposals

### 1.1 Confirmed Next Features

- **Top navigation bar** — Add a persistent navigation bar to all non-login/registration pages. Includes a profile icon with a dropdown menu containing: (1) a Profile page where the user can edit their name, email, password, and manage their events; (2) a Log Out link.

- **Footer** — Add a global footer to all pages with support for copyright text, privacy policy link, and other legal/informational links.

- **Custom email domain** — Send all application emails (auth, notifications, etc.) from the connected custom domain (pourtheoccasion.com) instead of the default Supabase or Vercel sender.

- **Email verification for new registrations** — Re-implement two-step email confirmation for new signups. New users receive a confirmation link via email and must verify before accessing the app.

---

## 2. Prioritization

| Proposal | Effort | Notes |
|----------|--------|-------|
| Top navigation bar | Small | Profile dropdown + logout |
| Footer | Small | Static content, legal links |
| Custom email domain | Small–Medium | Requires DNS/SMTP configuration |
| Email verification for new registrations | Small | Re-enable Supabase confirm email + email template |

---

## 3. Maintenance

Update this document as new proposals are added, priorities shift, or items are completed. Mark completed items with ✓.
