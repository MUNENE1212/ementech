# SSH Key Configuration Guide for Interserver VPS

## Current Status: ✅ SSH Keys Already Exist

You have a modern **Ed25519 SSH key pair** (created April 13, 2025):
- **Private Key:** `~/.ssh/id_ed25519` (keep this secret!)
- **Public Key:** `~/.ssh/id_ed25519.pub` (this goes on the VPS)

---

## Your SSH Public Key

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJFcqnE+laqSHQOq9+2E3h3D7YQWqB5nH8VqZ3tLk4Nx munen@munen-System-Product-Name
```

---

## Step-by-Step Setup

### Option 1: Add SSH Key to Interserver VPS (Recommended)

#### Method A: Via Interserver Control Panel (Easiest)

1. **Log into Interserver Control Panel**
   - Go to https://my.interserver.net
   - Log in with your credentials

2. **Navigate to VPS Settings**
   - Find your VPS instance
   - Look for "SSH Keys" or "Security" section

3. **Add Your Public Key**
   - Copy the public key above (including `ssh-ed25519` at the start)
   - Paste into the SSH key field
   - Label it something like "mentech-2025" or "munen-laptop"
   - Save/Add the key

4. **Note the VPS IP Address**
   - Find your VPS IP address in the control panel
   - It should look like: `123.45.67.89` or similar

5. **Test Connection**
   ```bash
   ssh root@YOUR_VPS_IP
   ```
   Example:
   ```bash
   ssh root@123.45.67.89
   ```

#### Method B: Manual Setup (If Control Panel Doesn't Support Keys)

If Interserver doesn't have a GUI option for SSH keys, you'll need to add it manually:

1. **Connect with Password First**
   ```bash
   ssh root@YOUR_VPS_IP
   ```
   - Enter your root password when prompted

2. **Add Your Public Key to VPS**
   ```bash
   # Create .ssh directory if it doesn't exist
   mkdir -p ~/.ssh

   # Set correct permissions
   chmod 700 ~/.ssh

   # Add your public key (RUN THIS ON YOUR LOCAL MACHINE)
   cat ~/.ssh/id_ed25519.pub | ssh root@YOUR_VPS_IP "cat >> ~/.ssh/authorized_keys"

   # Set correct permissions on authorized_keys
   ssh root@YOUR_VPS_IP "chmod 600 ~/.ssh/authorized_keys"
   ```

3. **Test SSH Key Login**
   ```bash
   ssh root@YOUR_VPS_IP
   ```
   - Should now login without password!

---

## Step-by-Step Testing

### 1. Test SSH Connection

```bash
# Replace with your actual VPS IP
ssh root@YOUR_VPS_IP
```

**First time connection:**
```
The authenticity of host '123.45.67.89 (ECDSA)' can't be established.
ECDSA key fingerprint is SHA256:abc123...
Are you sure you want to continue connecting (yes/no)?
```
Type: `yes` and press Enter

**Expected output if successful:**
```
Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-76-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/advantage

root@vps123456:~#
```

### 2. Verify Connection

Once logged in, run:

```bash
# Check OS version
cat /etc/os-release

# Check available memory
free -h

# Check disk space
df -h

# Check CPU cores
nproc
```

---

## SSH Config File (Optional but Recommended)

Create or edit `~/.ssh/config` on your local machine:

```bash
nano ~/.ssh/config
```

Add this configuration:

```
Host ementech-vps
    HostName YOUR_VPS_IP
    User root
    IdentityFile ~/.ssh/id_ed25519
    ServerAliveInterval 60
    ServerAliveCountMax 3

Host ementech
    HostName ementech.co.ke
    User root
    IdentityFile ~/.ssh/id_ed25519
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

Now you can connect with just:
```bash
ssh ementech-vps
```

---

## Troubleshooting

### Issue: "Permission denied (publickey)"

**Cause:** SSH key not properly added to VPS

**Solution:**
```bash
# Connect with password
ssh root@YOUR_VPS_IP

# On VPS, check authorized_keys
cat ~/.ssh/authorized_keys

# If empty or wrong, add it again
cat ~/.ssh/id_ed25519.pub | ssh root@YOUR_VPS_IP "cat >> ~/.ssh/authorized_keys"
```

### Issue: "Permissions are too open"

**Cause:** Incorrect file permissions on SSH files

**Solution (On VPS):**
```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

### Issue: "Connection refused"

**Cause:** SSH not running or wrong port

**Solution:**
```bash
# Try specifying port (default is 22)
ssh -p 22 root@YOUR_VPS_IP

# Or check with Interserver if they use custom SSH port
```

### Issue: "Host key verification failed"

**Cause:** Host key changed (VPS reinstalled)

**Solution:**
```bash
# Remove old host key
ssh-keygen -R YOUR_VPS_IP

# Try connecting again
ssh root@YOUR_VPS_IP
```

---

## Security Best Practices

### 1. Disable Password Authentication (After Key Works)

Once SSH key login is working, disable password auth:

```bash
# On VPS
sudo nano /etc/ssh/sshd_config

# Find and change:
PasswordAuthentication no
PubkeyAuthentication yes

# Restart SSH
sudo systemctl restart sshd
```

### 2. Change SSH Port (Optional but Recommended)

```bash
# On VPS
sudo nano /etc/ssh/sshd_config

# Change:
Port 2222  # or any port from 1024-65535

# Restart SSH
sudo systemctl restart sshd

# Update firewall
sudo ufw allow 2222/tcp
```

Then connect with:
```bash
ssh -p 2222 root@YOUR_VPS_IP
```

### 3. Create Non-Root User (Recommended)

```bash
# On VPS
adduser munen
usermod -aG sudo munen

# Add your SSH key to munen user
mkdir -p /home/munen/.ssh
cp ~/.ssh/authorized_keys /home/munen/.ssh/
chown -R munen:munen /home/munen/.ssh
chmod 700 /home/munen/.ssh
chmod 600 /home/munen/.ssh/authorized_keys
```

---

## Quick Reference Commands

```bash
# View your public key
cat ~/.ssh/id_ed25519.pub

# Test SSH connection
ssh root@YOUR_VPS_IP

# Copy public key to clipboard (Linux)
cat ~/.ssh/id_ed25519.pub | xclip -selection clipboard

# Copy public key to clipboard (WSL/Windows)
cat ~/.ssh/id_ed25519.pub | clip.exe

# Remove old host key
ssh-keygen -R YOUR_VPS_IP

# Check SSH connection
ssh -v root@YOUR_VPS_IP  # verbose mode for debugging
```

---

## What I Need From You

After setting up SSH, please provide:

1. ✅ **VPS IP Address** - e.g., `123.45.67.89`
2. ✅ **SSH Connection Confirmed** - "I can successfully SSH into the VPS"
3. ✅ **VPS Specifications** - CPU cores, RAM, Disk space (run `free -h`, `nproc`, `df -h`)
4. ⚠️ **Root Password** (keep private, only if SSH key fails)

---

## Next Steps After SSH Configured

Once SSH is working:

1. ✅ Run the automated setup script
2. ✅ Install all dependencies (Node.js, MongoDB, nginx, PM2)
3. ✅ Configure firewall and security
4. ✅ Deploy applications
5. ✅ Setup SSL certificates

---

## Summary

**Current Status:**
- ✅ SSH key exists: `id_ed25519` (modern, secure)
- ✅ Public key ready to copy (shown above)
- ⏳ Need to add key to Interserver VPS
- ⏳ Need to test connection

**Your SSH Public Key (copy this):**
```
ssh-edd25519 AAAAC3NzaC1lZDI1NTE5AAAAIJFcqnE+laqSHQOq9+2E3h3D7YQWqB5nH8VqZ3tLk4Nx munen@munen-System-Product-Name
```

**Recommended Actions:**
1. Log into Interserver control panel
2. Add SSH public key to VPS
3. Note VPS IP address
4. Test SSH connection: `ssh root@YOUR_VPS_IP`
5. Confirm connection works

Let me know once you've successfully connected, and we'll proceed with VPS setup! 🚀
