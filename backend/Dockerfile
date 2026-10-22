FROM php:8.2-cli

# Install system dependencies and PHP MySQL extensions
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libzip-dev \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    ca-certificates \
    curl \
    && docker-php-ext-install pdo_mysql mbstring bcmath \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy Composer binary
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy repository backend code
COPY . .

# Install production dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Prepare directory permissions for Laravel
RUN chmod -R 775 storage bootstrap/cache

EXPOSE 8000

# Run Laravel on Render's dynamic $PORT
CMD php artisan config:clear && php artisan serve --host=0.0.0.0 --port=${PORT:-8000}
