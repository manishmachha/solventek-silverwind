# Silverwind Deployment Guide

This guide covers deploying Silverwind to AWS EC2 with Jenkins CI/CD.

## Architecture Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Jenkins   │────▶│     ECR     │────▶│    EC2      │
│   (CI/CD)   │     │  (Registry) │     │  (Docker)   │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                    ┌─────────────┐           │
                    │     RDS     │◀──────────┤
                    │ (PostgreSQL)│           │
                    └─────────────┘           │
                                              │
                    ┌─────────────┐           │
                    │     S3      │◀──────────┘
                    │  (Storage)  │
                    └─────────────┘
```

## Prerequisites

- AWS Account with appropriate permissions
- EC2 instance (t3.medium or larger recommended)
- RDS PostgreSQL instance
- S3 bucket for file storage
- ECR repository (or Docker Hub)
- Jenkins server

## Step 1: AWS S3 Setup

1. Create an S3 bucket:

   ```bash
   aws s3 mb s3://solventek-silverwind --region eu-north-1
   ```

2. Set bucket CORS policy for presigned URLs:

   ```json
   {
     "CORSRules": [
       {
         "AllowedOrigins": ["*"],
         "AllowedMethods": ["GET", "PUT"],
         "AllowedHeaders": ["*"],
         "ExposeHeaders": ["ETag"],
         "MaxAgeSeconds": 3000
       }
     ]
   }
   ```

3. Create IAM user/role with S3 access:
   - `s3:PutObject`
   - `s3:GetObject`
   - `s3:DeleteObject`
   - `s3:HeadObject`

## Step 2: EC2 Instance Setup

1. Launch Ubuntu/Amazon Linux 2 instance (t3.medium minimum)

2. Security Group rules:
   - SSH (22) from your IP
   - HTTP (80) from anywhere
   - HTTPS (443) from anywhere

3. Install Docker and Docker Compose:

   ```bash
   # Amazon Linux 2
   sudo yum update -y
   sudo amazon-linux-extras install docker -y
   sudo systemctl start docker
   sudo systemctl enable docker
   sudo usermod -aG docker ec2-user

   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

4. Create deployment directory:

   ```bash
   mkdir -p ~/silverwind
   cd ~/silverwind
   ```

5. Create `.env` file (copy from `.env.example` and fill values)

## Step 3: ECR Repository Setup

1. Create repositories:

   ```bash
   aws ecr create-repository --repository-name silverwind-backend
   aws ecr create-repository --repository-name silverwind-frontend
   ```

2. Get login command:
   ```bash
   aws ecr get-login-password --region eu-north-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.eu-north-1.amazonaws.com
   ```

## Step 4: Jenkins Configuration

1. Install required plugins:
   - Docker Pipeline
   - SSH Agent
   - Credentials

2. Create credentials:
   - `docker-registry-url`: ECR URL
   - `docker-registry-credentials`: AWS ECR credentials
   - `aws-credentials`: AWS access keys
   - `ec2-host`: EC2 public IP/hostname
   - `ec2-ssh-key`: SSH private key for EC2

3. Create Pipeline job pointing to your repository

## Step 5: First Deployment

1. Push code to trigger Jenkins build, or run manually

2. Verify deployment:
   ```bash
   # On EC2
   docker-compose -f docker-compose.prod.yml ps
   docker-compose -f docker-compose.prod.yml logs
   ```

## Step 6: SSL/HTTPS Setup (Optional)

1. Install Certbot:

   ```bash
   sudo yum install certbot -y
   ```

2. Generate certificate:

   ```bash
   sudo certbot certonly --standalone -d your-domain.com
   ```

3. Update nginx.conf for HTTPS (see nginx-ssl.conf.example)

## Troubleshooting

### Backend not starting

```bash
docker-compose -f docker-compose.prod.yml logs backend
```

### Database connection issues

- Verify RDS security group allows EC2 access
- Check DB credentials in `.env`

### S3 upload failures

- Verify AWS credentials
- Check IAM permissions
- Ensure bucket exists and region matches

## Rollback

To rollback to a previous version:

```bash
export IMAGE_TAG=<previous-build-number>
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

## Monitoring

- Use `docker stats` for resource monitoring
- Consider AWS CloudWatch for logs
- Set up health check alerts
