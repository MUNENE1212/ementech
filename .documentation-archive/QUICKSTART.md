# Ementech Website - Quick Start Guide

## 🚀 Quick Start

### 1. Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:3000
```

### 2. Configuration

#### Email Setup (Required for contact forms)

1. Sign up at [EmailJS](https://www.emailjs.com/)
2. Create a service and email template
3. Update credentials in `src/components/sections/Contact.tsx`:

```typescript
await emailjs.send(
  'YOUR_SERVICE_ID',    // Replace with your service ID
  'YOUR_TEMPLATE_ID',   // Replace with your template ID
  {
    from_name: formData.name,
    from_email: formData.email,
    company: formData.company,
    message: formData.message,
  },
  'YOUR_PUBLIC_KEY'     // Replace with your public key
);
```

#### WhatsApp Number

Update in `src/components/sections/Contact.tsx`:

```tsx
href="https://wa.me/254700000000"  // Replace with your WhatsApp number
```

#### Contact Information

Update in `src/components/sections/Contact.tsx` and `src/components/layout/Footer.tsx`:

- Email: `info@ementech.com`
- Phone: `+254 700 000 000`
- Location: `Nairobi, Kenya`

### 3. Build for Production

```bash
# Create optimized production build
npm run build

# Preview production build locally
npm run preview
```

The `dist/` folder contains the production files ready for deployment.

### 4. Deployment to VPS

#### Transfer Files to VPS

```bash
# Upload dist folder to VPS
scp -r dist/ user@your-vps-ip:/var/www/ementech
```

#### Configure Nginx

Create `/etc/nginx/sites-available/ementech`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        root /var/www/ementech;
        try_files $uri $uri/ /index.html;
    }

    # Add your other project locations
    location /green_rent {
        proxy_pass http://localhost:3001;
        # ... proxy settings
    }

    location /smartbiz {
        proxy_pass http://localhost:3002;
        # ... proxy settings
    }
}
```

#### Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/ementech /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### SSL Certificate

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### 5. Customization

#### Colors

Edit `tailwind.config.js`:

```js
theme: {
  extend: {
    colors: {
      primary: { /* your colors */ },
      accent: { /* your colors */ },
      dark: { /* your colors */ }
    }
  }
}
```

#### Content

- **Products**: Edit `src/components/sections/Products.tsx`
- **Services**: Edit `src/components/sections/Services.tsx`
- **About**: Edit `src/components/sections/About.tsx`
- **Contact**: Edit `src/components/sections/Contact.tsx`

#### Meta Tags

Edit `index.html` for SEO meta tags, Open Graph, and Twitter cards.

### 6. Testing

```bash
# Run development server
npm run dev

# Build and test production
npm run build
npm run preview
```

## 📦 What's Included

- ✅ React 18 + TypeScript
- ✅ Vite 5 (lightning fast)
- ✅ Tailwind CSS 3
- ✅ Framer Motion (animations)
- ✅ Responsive design
- ✅ Dark mode (futuristic theme)
- ✅ Contact form with EmailJS
- ✅ WhatsApp integration
- ✅ SEO optimized
- ✅ Production ready

## 🎨 Features

- Modern, futuristic AI/Tech design
- Smooth animations and transitions
- Fully responsive (mobile-first)
- Fast loading (Vite optimization)
- SEO meta tags and Open Graph
- Lead capture forms
- Product showcase
- Services portfolio
- About section
- Contact section

## 🔧 Troubleshooting

### Build fails

```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Email not working

- Verify EmailJS credentials
- Check EmailJS service status
- Check browser console for errors

### Nginx 404 errors

- Check file permissions: `sudo chown -R www-data:www-data /var/www/ementech`
- Verify Nginx configuration: `sudo nginx -t`
- Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`

## 📞 Support

For issues or questions, contact the development team.

---

Built with ❤️ by Ementech
