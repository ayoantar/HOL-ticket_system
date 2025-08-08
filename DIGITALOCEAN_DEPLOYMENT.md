# DigitalOcean App Platform Deployment Guide

## Quick Deployment Steps

### 1. Prepare Your Git Repository

Make sure all your code is pushed to your Git repository (GitHub, GitLab, etc.):
```bash
git add .
git commit -m "Prepare for DO App Platform deployment"
git push origin main
```

### 2. Deploy to App Platform

1. **Log into DigitalOcean Console**
   - Go to https://cloud.digitalocean.com
   - Navigate to "Apps" in the left sidebar
   - Click "Create App"

2. **Connect Your Repository**
   - Choose "GitHub" (or your Git provider)
   - Authorize DigitalOcean to access your repositories
   - Select your repository
   - Choose the `main` branch
   - Enable "Autodeploy" for automatic deployments on push

3. **Configure Resources**
   - DigitalOcean should auto-detect your app.yaml configuration
   - Verify it shows:
     - **Backend service** (Node.js, port 5002)
     - **Frontend service** (Static site from React build)
     - **PostgreSQL database** (14.x)

4. **Set Environment Variables**
   Go to the "Environment Variables" section and add:
   ```
   NODE_ENV=production
   PORT=5002
   JWT_SECRET=your-super-secure-jwt-secret-at-least-32-chars
   CLIENT_URL=https://your-app-name-xxxxx.ondigitalocean.app
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   DATABASE_URL=${db.DATABASE_URL}
   ```

5. **Review and Create**
   - Review your configuration
   - Click "Create Resources"
   - Wait for deployment (usually 5-10 minutes)

### 3. Initialize Database

After deployment, you'll need to run the database initialization:

1. **Get Database Connection Info**
   - In your App dashboard, go to "Database" tab
   - Copy the connection details

2. **Run Database Setup**
   You can either:
   - Use DigitalOcean's database console to run `database-init.sql`
   - Connect via `psql` and run the script
   - Use a database management tool like pgAdmin

### 4. Update Admin User

After database initialization, update the admin user with your details:
```sql
UPDATE users 
SET name = 'Your Name', email = 'your-admin@email.com'
WHERE role = 'admin' AND email = 'admin@yourdomain.com';
```

Change the default password by logging in and updating your profile.

## Cost Estimation

### Basic Setup (Recommended for start):
- **Backend**: Basic ($5/month) - 512MB RAM, 0.5 vCPU
- **Frontend**: Static site (Free with backend)
- **Database**: Development ($7/month) - 1GB RAM, 1 vCPU, 10GB storage
- **Total**: ~$12/month

### Production Setup:
- **Backend**: Professional ($12/month) - 1GB RAM, 1 vCPU
- **Frontend**: Static site (Free)
- **Database**: Basic ($15/month) - 1GB RAM, 1 vCPU, 25GB storage
- **Total**: ~$27/month

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NODE_ENV` | Yes | Environment | `production` |
| `PORT` | Yes | Backend port | `5002` |
| `CLIENT_URL` | Yes | Frontend URL | `https://your-app.ondigitalocean.app` |
| `JWT_SECRET` | Yes | JWT signing key | `your-32-char-secret` |
| `DATABASE_URL` | Auto | Database connection | `${db.DATABASE_URL}` |
| `EMAIL_HOST` | Yes | SMTP server | `smtp.gmail.com` |
| `EMAIL_PORT` | Yes | SMTP port | `587` |
| `EMAIL_USER` | Yes | Email username | `yourapp@gmail.com` |
| `EMAIL_PASS` | Yes | Email password | `your-app-password` |

## Post-Deployment Setup

### 1. Test the Application
- Visit your app URL
- Register a test account
- Try creating different request types
- Test email notifications

### 2. Configure DNS (Optional)
If you want a custom domain:
- Go to "Settings" > "Domains" in your app
- Add your custom domain
- Update DNS records as instructed

### 3. Set Up SSL (Automatic)
DigitalOcean provides automatic SSL certificates for both the default domain and custom domains.

## Monitoring and Maintenance

### App Platform Features:
- **Automatic scaling** based on traffic
- **Health checks** and auto-restart
- **Deployment history** and rollbacks
- **Real-time logs** and metrics
- **Automatic SSL** certificate management

### Monitoring:
- Monitor resource usage in the DigitalOcean dashboard
- Set up alerts for high CPU/memory usage
- Review application logs regularly

### Backups:
- Database backups are automatic (7-day retention)
- Consider additional backup strategies for critical data
- File uploads are stored on the app instance (consider external storage for production)

## Troubleshooting

### Common Issues:

1. **Build Failures**
   - Check build logs in the deployment history
   - Verify package.json scripts are correct
   - Ensure all dependencies are in package.json

2. **Database Connection Issues**
   - Verify DATABASE_URL is set to `${db.DATABASE_URL}`
   - Check database is running and accessible
   - Review database logs

3. **Email Not Working**
   - Verify email credentials
   - Check if using Gmail: enable "App Passwords"
   - Review email service logs

4. **File Upload Issues**
   - App Platform has file system limitations
   - Consider using DigitalOcean Spaces for file storage
   - Check file size limits and MIME types

### Getting Help:
- Check DigitalOcean documentation
- Review application logs in the dashboard
- Contact DigitalOcean support for platform issues

## Scaling Considerations

### When to Scale:
- High CPU usage (>80% consistently)
- High memory usage (>80% consistently)
- Slow response times
- Increasing user base

### Scaling Options:
- **Vertical**: Increase instance size
- **Horizontal**: Increase instance count
- **Database**: Upgrade to larger database
- **CDN**: Add CDN for static assets

## Security Best Practices

1. **Environment Variables**: Never commit secrets to Git
2. **JWT Secret**: Use a strong, unique secret (32+ characters)
3. **Database**: Keep database credentials secure
4. **Email**: Use app passwords, not account passwords
5. **HTTPS**: Always use HTTPS (automatic with App Platform)
6. **Updates**: Keep dependencies updated regularly

## Development Workflow

### Local Development:
```bash
# Backend
cd backend && npm run dev

# Frontend  
cd frontend && npm start
```

### Deployment:
```bash
# Commit and push changes
git add .
git commit -m "Your changes"
git push origin main

# App Platform auto-deploys from main branch
```

### Testing Production:
- Use staging branches for testing
- Test database migrations carefully
- Monitor logs after deployment
- Have rollback plan ready