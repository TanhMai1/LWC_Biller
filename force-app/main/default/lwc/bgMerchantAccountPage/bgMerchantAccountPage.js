import { LightningElement, api, track } from 'lwc';
import getMerchantSummary from '@salesforce/apex/BG_PartnerMerchantDashboardController.getMerchantSummary';

export default class BgMerchantAccountPage extends LightningElement {
    @api accountId;
    @api isNested = false;
    @api parentAccountName = ''; // NEW: Receive parent name from parent component
    
    @track merchantData;
    @track isLoading = true;

    connectedCallback() {
        this.loadMerchantData();
    }

    async loadMerchantData() {
        this.isLoading = true;
        try {
            this.merchantData = await getMerchantSummary({ accountId: this.accountId });
            
            // Dispatch record names to parent (only if not nested)
            if (!this.isNested && this.merchantData) {
                const eventDetail = {};
                
                // Always dispatch merchant name
                if (this.merchantData.accountName) {
                    eventDetail.recordName = this.merchantData.accountName;
                }
                
                // Dispatch parent account name if it exists
                if (this.merchantData.parentAccountName) {
                    eventDetail.parentAccountName = this.merchantData.parentAccountName;
                }
                
                this.dispatchEvent(new CustomEvent('recordloaded', {
                    detail: eventDetail,
                    bubbles: true,
                    composed: true
                }));
            }
        } catch (error) {
            console.error('Error loading merchant data:', error);
        } finally {
            this.isLoading = false;
        }
    }

    handleOpenNotes() {
        this.dispatchEvent(new CustomEvent('opennotes', {
            detail: { parentId: this.accountId }
        }));
    }

    // Automatically detect if partner data exists
    get hasPartnerData() {
        return this.merchantData && (
            this.merchantData.pluginMonthlyFee || 
            this.merchantData.pluginBillTo || 
            this.merchantData.techFeeMinimumPlan || 
            this.merchantData.achSoldBy
        );
    }

    // Automatically show partner summary if data exists
    get showPartnerSummary() {
        return this.hasPartnerData;
    }

    // NEW: Use parent name from either props (passed down) or data (from Apex)
    // Priority: props > Apex data > fallback
    get displayParentAccountName() {
        // If parent passed it down as prop, use that (for shared state)
        if (this.parentAccountName) {
            return this.parentAccountName;
        }
        // Otherwise use from Apex data
        if (this.merchantData?.parentAccountName) {
            return this.merchantData.parentAccountName;
        }
        // Fallback
        return 'PNC';
    }

    get formattedLastTransaction() {
        if (!this.merchantData?.lastTransactionDate) return 'N/A';
        return new Date(this.merchantData.lastTransactionDate).toLocaleDateString();
    }

    get formattedLevel() {
        if (!this.merchantData?.level) return 'N/A';
        return `${this.merchantData.level}`;
    }

    get formattedPluginFee() {
        if (!this.merchantData?.pluginMonthlyFee) return 'N/A';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
            .format(this.merchantData.pluginMonthlyFee);
    }

    get merchantSummaryColumnClass() {
        return this.showPartnerSummary ? 'slds-col slds-size_1-of-2' : 'slds-col slds-size_1-of-3';
    }
}