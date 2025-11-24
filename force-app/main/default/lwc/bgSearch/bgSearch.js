import { LightningElement, track } from 'lwc';
import searchRecords from '@salesforce/apex/BG_PartnerMerchantDashboardController.searchRecords';

export default class BgSearch extends LightningElement {
    @track searchTerm = '';
    @track searchResults = [];
    @track isSearching = false;
    @track hasSearched = false;

    searchTimeout;

    handleSearchInput(event) {
        const value = event.target.value;
        this.searchTerm = value;
        console.log('Search input changed:', value);

        // Clear previous timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        // Debounce search
        if (value.length >= 2) {
            console.log('Scheduling search for:', value);
            this.searchTimeout = setTimeout(() => {
                this.performSearch();
            }, 300);
        } else {
            this.searchResults = [];
            this.hasSearched = false;
        }
    }

    async performSearch() {
        console.log('performSearch called with term:', this.searchTerm);
        this.isSearching = true;
        this.hasSearched = true;
        try {
            console.log('Calling Apex searchRecords...');
            const results = await searchRecords({ searchTerm: this.searchTerm });
            console.log('Search results received:', results);
            this.searchResults = results.map(r => ({
                ...r,
                iconName: this.getIconName(r.objectType, r.recordType)
            }));
            console.log('Processed search results:', this.searchResults);
        } catch (error) {
            console.error('Search error:', error);
            console.error('Error details:', JSON.stringify(error));
            this.searchResults = [];
        } finally {
            this.isSearching = false;
        }
    }

    handleResultSelect(event) {
        const recordId = event.currentTarget.dataset.recordId;
        const objectType = event.currentTarget.dataset.objectType;
        const recordType = event.currentTarget.dataset.recordType;

        // Dispatch custom event to parent
        this.dispatchEvent(new CustomEvent('recordselect', {
            detail: { recordId, objectType, recordType }
        }));

        // Clear search
        this.searchTerm = '';
        this.searchResults = [];
        this.hasSearched = false;
    }

    getIconName(objectType, recordType) {
        if (objectType === 'Contact') return 'standard:contact';
        if (recordType === 'Reseller') return 'standard:partner_marketing_budget';
        return 'standard:account';
    }

    get showResults() {
        return !this.isSearching && this.searchResults.length > 0;
    }

    get noResults() {
        return !this.isSearching && this.hasSearched && this.searchResults.length === 0;
    }
}