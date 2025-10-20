# Credential Testing Guide

## 🎯 **Enhanced Credential Management**

The credential page now supports a two-tab interface:
- **Pending Credentials**: Shows incoming credential offers that need to be accepted/rejected
- **Stored Credentials**: Shows successfully stored credentials in your wallet

## 📋 **Features Implemented**

### **1. Credential Exchange Tracking**
- Shows both stored credentials AND credential exchange records
- Real-time updates via 30-second polling
- Clear status indicators for each credential state

### **2. Credential States Supported**
- `offer_received` - Issuer has sent a credential offer (can accept/reject)
- `credential_issued` - Credential has been issued and ready to store
- `credential_acked` - Credential has been acknowledged 
- `stored` - Credential is stored in wallet
- `done` - Exchange complete

### **3. Actions Available**
- **Accept**: Store the credential in your wallet
- **Reject**: Send problem report to decline the credential
- **View Details**: See full credential information
- **Auto-refresh**: Page polls for new credentials every 30 seconds

## 🧪 **Testing the Credential Flow**

### **Step 1: Setup**
1. Ensure both backend and frontend are running
2. Create a user account and wallet
3. Navigate to the Credentials page

### **Step 2: Receive Credential Offer**
When an issuer sends a credential offer:
1. It will appear in the "Pending Credentials" tab
2. Status will show as "Offer Received"
3. You'll see Accept/Reject buttons

### **Step 3: Accept Credential**
1. Click "Accept" button on a pending credential
2. The credential will be stored in your wallet
3. Success message will appear
4. Credential moves to "Stored Credentials" tab

### **Step 4: Reject Credential**
1. Click "Reject" button on a pending credential
2. Problem report is sent to issuer
3. Exchange is marked as failed

## 🔄 **API Endpoints Used**

- `GET /api/credential/{walletId}/credentials` - Get stored credentials
- `GET /api/credential/{walletId}/credential-exchange` - Get credential exchanges
- `POST /api/credential/{walletId}/credential-exchange/{credExId}/store` - Accept credential
- `POST /api/credential/{walletId}/credential-exchange/{credExId}/problem-report` - Reject credential

## 🎨 **UI Improvements**

### **Tab Interface**
- Clean tab navigation showing counts
- Separate views for pending vs stored
- Color-coded status indicators

### **Status Colors**
- 🔵 Blue: Offer Received
- 🟣 Purple: Credential Issued 
- 🟢 Green: Stored/Complete
- 🟡 Yellow: Request Sent
- ⚪ Gray: Other states

### **Action Buttons**
- 🟢 Green "Accept" for storing credentials
- 🔴 Red "Reject" for declining offers
- 🔍 Blue "View Details" for inspection

## 🚀 **Next Steps**

1. Test with actual ACA-Py issuer
2. Verify webhook integration works
3. Add notification system for new credentials
4. Implement credential search/filtering
5. Add credential verification capabilities

## 📝 **Notes**

- Page automatically refreshes every 30 seconds
- Success/error messages appear at top of page
- Empty states guide users on what to expect
- Mobile-responsive design with card grid layout