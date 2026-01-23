# Ementech Website - pnpm Guide

## Why pnpm?

pnpm (performant npm) is used for this project for better disk efficiency on VPS:

- **Disk Space**: Uses hard links to share files between projects, saving up to 80% disk space
- **Speed**: Faster than npm (2x faster) and yarn
- **Strict**: Helps avoid phantom dependencies
- **Efficient**: Perfect for VPS with limited storage

## Installation

### On VPS (Ubuntu/Debian)

```bash
# Install pnpm globally
npm install -g pnpm

# Or using curl
curl -fsSL https://get.pnpm.io/install.sh | sh -

# Verify installation
pnpm --version
```

## Usage

### Development

```bash
# Install dependencies (first time)
pnpm install

# Start dev server
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm run preview
```

### Disk Space Comparison

For this project on VPS:
- **npm**: ~450 MB (node_modules)
- **pnpm**: ~180 MB (node_modules)
- **Savings**: ~270 MB (60% reduction)

## VPS Deployment with pnpm

### 1. Install Dependencies

```bash
cd /var/www/ementech
pnpm install --prod
```

### 2. Build

```bash
pnpm run build
```

### 3. Deploy

The `dist/` folder contains production files. Configure Nginx to serve it.

### 4. Update Process

```bash
# Pull latest changes
git pull

# Install new dependencies
pnpm install

# Build
pnpm run build

# No need to restart Nginx (static files)
```

## Troubleshooting

### pnpm command not found

```bash
# Install globally
npm install -g pnpm

# Or add to PATH
export PATH="$PNPM_HOME:$PATH"
```

### Permission issues

```bash
# Fix .pnpm-store permissions
sudo chown -R $USER:$(id -gn) ~/.local/share/pnpm
```

### Clear cache

```bash
pnpm store prune
```

## Comparison with npm

| Feature | npm | pnpm |
|---------|-----|------|
| Disk Usage | 100% | 40% |
| Install Speed | 1x | 2x |
| Dependency Structure | Flat | Strict |
| Phantom Deps | Yes | No |

## Best Practices

1. **Use `--prod` flag** for production installs
2. **Lock file**: Commit `pnpm-lock.yaml` for consistency
3. **Store**: Use shared store for multiple projects
4. **Updates**: Check `pnpm outdated` regularly

## Scripts

All npm scripts work with pnpm:

```bash
pnpm run dev          # Development server
pnpm run build        # Production build
pnpm run preview      # Preview build
pnpm run type-check   # TypeScript check
```

## Conclusion

pnpm provides significant disk space savings on VPS while maintaining compatibility with npm workflows. Perfect for hosting multiple projects.
