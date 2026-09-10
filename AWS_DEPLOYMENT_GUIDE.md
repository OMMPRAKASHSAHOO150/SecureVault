# SecureVault - AWS Deployment & Dockerization Guide

This document provides step-by-step instructions for running **SecureVault** locally using Docker Compose, as well as deploying the full stack application to **Amazon Web Services (AWS)**.

---

## 🚀 Quick Start (Local Docker Compose Testing)

Before deploying to AWS, test the containerized application locally on your computer:

```bash
# Navigate to the project root directory
cd SecureVault

# Build and start all 3 containers (Postgres, Backend, Frontend)
docker-compose up -d --build

# View container status and logs
docker-compose ps
docker-compose logs -f
```

- **Frontend Application**: [http://localhost](http://localhost)
- **Backend API**: [http://localhost:8080](http://localhost:8080)
- **PostgreSQL Database**: Port `5432`

To stop the services:
```bash
docker-compose down
```

---

## ☁️ Deploying SecureVault to AWS

### Option 1: AWS EC2 with Docker Compose (Recommended & Easiest)

This approach deploys the entire application stack (Frontend Nginx, Spring Boot Backend, PostgreSQL) on a single AWS EC2 virtual machine using Docker.

#### Step 1: Launch an AWS EC2 Instance
1. Log in to the [AWS Management Console](https://aws.amazon.com/console/).
2. Navigate to **EC2** -> **Launch Instance**.
3. **Name**: `SecureVault-Server`
4. **AMI**: Ubuntu 22.04 LTS (64-bit x86) or Amazon Linux 2023.
5. **Instance Type**: `t3.small` or `t3.medium` (minimum 2 GB RAM recommended).
6. **Key Pair**: Select or create a new key pair (`.pem`) for SSH access.
7. **Network Settings / Security Group**:
   - Allow SSH (`Port 22`) from your IP.
   - Allow HTTP (`Port 80`) from Anywhere (`0.0.0.0/0`).
   - Allow HTTPS (`Port 443`) from Anywhere (`0.0.0.0/0`).
   - Allow Custom TCP (`Port 8080`) from Anywhere (`0.0.0.0/0`).
8. Click **Launch Instance**.

#### Step 2: Connect to EC2 and Install Docker
Open your terminal and SSH into your EC2 instance:
```bash
ssh -i /path/to/your-key.pem ubuntu@<YOUR-EC2-PUBLIC-IP>
```

Install Docker and Docker Compose on the EC2 instance:
```bash
# Update system packages
sudo apt-get update -y && sudo apt-get upgrade -y

# Install Docker
sudo apt-get install -y docker.io docker-compose git

# Enable and start Docker service
sudo systemctl enable docker
sudo systemctl start docker

# Add your user to the docker group
sudo usermod -aG docker ubuntu
newgrp docker
```

#### Step 3: Deploy SecureVault Code
Clone your repository or transfer the project files to the EC2 server:
```bash
# Option A: Clone via Git
git clone <YOUR_REPOSITORY_URL> SecureVault
cd SecureVault

# Option B: Or copy files via SCP from your local machine:
# scp -i /path/to/your-key.pem -r SecureVault/ ubuntu@<YOUR-EC2-PUBLIC-IP>:~/SecureVault
```

#### Step 4: Launch Containers on AWS
```bash
cd SecureVault

# Build and start containers in detached mode
docker-compose up -d --build

# Confirm containers are healthy
docker-compose ps
```

Visit `http://<YOUR-EC2-PUBLIC-IP>` in your web browser!

---

### Option 2: Enterprise AWS Architecture (ECS Fargate + RDS PostgreSQL)

For production enterprise workloads requiring autoscaling, high availability, and managed database backups:

```
                  +-----------------------+
                  |  AWS Application LB   |
                  +-----------+-----------+
                              |
              +---------------+---------------+
              |                               |
    +---------v---------+           +---------v---------+
    |  AWS ECS Fargate  |           |  AWS ECS Fargate  |
    | (Frontend Nginx)  |           | (Spring Boot App) |
    +-------------------+           +---------+---------+
                                              |
                                    +---------v---------+
                                    | AWS RDS Postgres  |
                                    +-------------------+
```

1. **Database**: Provision an **AWS RDS PostgreSQL** instance.
2. **Container Registry**: Push Docker images to **AWS Elastic Container Registry (ECR)**:
   ```bash
   # Build & tag backend image
   docker build -t securevault-backend ./backend
   docker tag securevault-backend:latest <AWS_ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/securevault-backend:latest
   
   # Build & tag frontend image
   docker build -t securevault-frontend ./frontend
   docker tag securevault-frontend:latest <AWS_ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/securevault-frontend:latest
   
   # Push to ECR
   docker push <AWS_ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/securevault-backend:latest
   docker push <AWS_ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/securevault-frontend:latest
   ```
3. **Compute**: Create an **AWS ECS Task Definition & Service** using AWS Fargate serverless containers.

---

## 🔒 Enabling SSL/HTTPS (Domain Setup)

To configure HTTPS with free SSL certificates from Let's Encrypt on your EC2 instance:

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtain SSL Certificate for your domain (e.g. securevault.yourdomain.com)
sudo certbot --nginx -d securevault.yourdomain.com
```

---

## 🛠️ Environment Configuration Reference

| Parameter | Default Value | Description |
|-----------|---------------|-------------|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://postgres:5432/credential_management` | PostgreSQL JDBC connection URL |
| `SPRING_DATASOURCE_USERNAME` | `postgres` | Database Username |
| `SPRING_DATASOURCE_PASSWORD` | `securevaultpassword` | Database Password |
| `JWT_SECRET` | *(64-byte Base64 key)* | HMAC-SHA256 Signing key for authentication tokens |
| `APP_MAIL_MODE` | `dev` / `smtp` | Set `smtp` for real emails, `dev` for console logging |
| `FRONTEND_URL` | `http://localhost` | Frontend origin address allowed by CORS |
