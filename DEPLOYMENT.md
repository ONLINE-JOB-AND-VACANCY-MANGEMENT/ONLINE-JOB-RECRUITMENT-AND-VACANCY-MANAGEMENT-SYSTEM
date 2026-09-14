# AASTU JobPortal deployment

This guide deploys the Laravel API and the Vite-built React application to one
Ubuntu VPS. It uses Oracle Cloud Always Free as the example provider and
`sslip.io` hostnames, so a paid domain is not required.

The example hostnames below use `SERVER_IP` as a placeholder. Replace it with
the public IPv4 address written with hyphens:

```text
203.0.113.45 -> api.203-0-113-45.sslip.io
                 app.203-0-113-45.sslip.io
```

## 1. Create the server

Create an Ubuntu 22.04 or 24.04 ARM VM in an Oracle Cloud Always Free
availability domain. Assign a reserved public IPv4 address if available.
Open TCP ports 22, 80, and 443 in both the cloud security list and the
Ubuntu firewall:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

Point the SSH command at the VM's public address:

```bash
ssh ubuntu@SERVER_IP
```

## 2. Install the server software

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx mysql-server git unzip certbot python3-certbot-nginx \
  software-properties-common
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update
sudo apt install -y \
  php8.2-fpm php8.2-cli php8.2-mysql php8.2-mbstring php8.2-xml \
  php8.2-curl php8.2-zip php8.2-bcmath
```

Install Composer using the official installer, then verify it:

```bash
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
php composer-setup.php --install-dir=/usr/local/bin --filename=composer
rm composer-setup.php
composer --version
```

## 3. Create the production database

Run the hardening wizard first:

```bash
sudo mysql_secure_installation
```

Create a database and a dedicated account. Use a long random password and
keep the same values for the backend environment file:

```bash
sudo mysql
```

```sql
CREATE DATABASE aastu_jobportal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'aastu_jobportal'@'localhost' IDENTIFIED BY 'replace-with-a-long-random-password';
GRANT ALL PRIVILEGES ON aastu_jobportal.* TO 'aastu_jobportal'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 4. Upload the application

Create the deployment directory and clone the repository. Replace the
repository URL and branch with the project values:

```bash
sudo mkdir -p /var/www/aastu-jobportal
sudo chown -R "$USER":"$USER" /var/www/aastu-jobportal
git clone YOUR_REPOSITORY_URL /var/www/aastu-jobportal
cd /var/www/aastu-jobportal
git checkout YOUR_PRODUCTION_BRANCH
```

Install backend dependencies without development packages:

```bash
cd /var/www/aastu-jobportal/backend
composer install --no-dev --optimize-autoloader
cp .env.production.example .env
nano .env
```

In `.env`, replace `SERVER_IP`, the database password, and the empty
`APP_KEY`. Generate the key on the server (this updates `.env`):

```bash
php artisan key:generate --force
php artisan migrate --force
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

`storage:link` is required: resumes and other uploads use Laravel's `public`
disk and are served through `/storage/...`.

Build the frontend locally, not on the VPS:

```powershell
cd frontend
Copy-Item .env.production.example .env.production
# Edit .env.production and replace SERVER_IP.
npm install
npm run build
```

Upload the resulting `frontend/dist` directory to
`/var/www/aastu-jobportal/frontend/dist` using SCP, SFTP, or rsync. Do not
upload `node_modules`, and do not commit either production `.env` file.

## 5. Configure permissions

```bash
sudo chown -R www-data:www-data /var/www/aastu-jobportal/backend/storage
sudo chown -R www-data:www-data /var/www/aastu-jobportal/backend/bootstrap/cache
sudo chmod -R ug+rwx /var/www/aastu-jobportal/backend/storage
sudo chmod -R ug+rwx /var/www/aastu-jobportal/backend/bootstrap/cache
```

## 6. Configure Nginx

Copy the templates from `deploy/nginx` into Nginx's sites directory, replacing
`SERVER_IP` in both files:

```bash
cd /var/www/aastu-jobportal
sudo cp deploy/nginx/aastu-api.conf /etc/nginx/sites-available/aastu-api
sudo cp deploy/nginx/aastu-app.conf /etc/nginx/sites-available/aastu-app
sudo ln -s /etc/nginx/sites-available/aastu-api /etc/nginx/sites-enabled/aastu-api
sudo ln -s /etc/nginx/sites-available/aastu-app /etc/nginx/sites-enabled/aastu-app
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

Check both HTTP URLs before requesting certificates:

```text
http://api.SERVER_IP.sslip.io/api/...
http://app.SERVER_IP.sslip.io
```

## 7. Enable HTTPS

`sslip.io` resolves the hostname to the encoded server address, allowing
Let's Encrypt to validate both names:

```bash
sudo certbot --nginx \
  -d api.SERVER_IP.sslip.io \
  -d app.SERVER_IP.sslip.io
```

Choose the redirect-to-HTTPS option. After Certbot completes, verify:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Update the backend `APP_URL`, `CORS_ALLOWED_ORIGINS`, and frontend
`VITE_API_BASE_URL` to the final HTTPS names before rebuilding the frontend.
`APP_URL` must be the API URL because Laravel uses it when generating resume
links such as `https://api.../storage/...`.

## 8. Verify the deployment

```bash
curl -I https://app.SERVER_IP.sslip.io
curl -I https://api.SERVER_IP.sslip.io
cd /var/www/aastu-jobportal/backend
php artisan about
php artisan migrate:status
```

Open the frontend URL in a browser and test registration, login, job browsing,
resume upload/download, bookmarks, and the manager/HR workflows. If a browser
request is blocked, compare the browser origin exactly with
`CORS_ALLOWED_ORIGINS` (origins have no trailing slash), then clear cached
configuration:

```bash
php artisan optimize:clear
php artisan config:cache
```

## 9. Updating the application

Build and upload the frontend locally, then update the API on the server:

```bash
cd /var/www/aastu-jobportal
git pull --ff-only
cd backend
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan storage:link
php artisan optimize
sudo systemctl reload php8.2-fpm
sudo systemctl reload nginx
```

Never place production secrets in Git, and take a MySQL backup before schema
changes:

```bash
mysqldump -u aastu_jobportal -p aastu_jobportal > ~/aastu-jobportal-backup.sql
```
