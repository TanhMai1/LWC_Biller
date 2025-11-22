declare module "@salesforce/apex/BG_PartnerMerchantDashboardController.searchRecords" {
  export default function searchRecords(param: {searchTerm: any}): Promise<any>;
}
declare module "@salesforce/apex/BG_PartnerMerchantDashboardController.resolveContext" {
  export default function resolveContext(param: {recordId: any}): Promise<any>;
}
declare module "@salesforce/apex/BG_PartnerMerchantDashboardController.getPartnerSummary" {
  export default function getPartnerSummary(param: {accountId: any}): Promise<any>;
}
declare module "@salesforce/apex/BG_PartnerMerchantDashboardController.getResellerContacts" {
  export default function getResellerContacts(param: {accountId: any, pageNum: any, pageSize: any, sortField: any, sortDir: any, searchTerm: any}): Promise<any>;
}
declare module "@salesforce/apex/BG_PartnerMerchantDashboardController.getMerchantSummary" {
  export default function getMerchantSummary(param: {accountId: any}): Promise<any>;
}
declare module "@salesforce/apex/BG_PartnerMerchantDashboardController.getMerchantsByResellerContact" {
  export default function getMerchantsByResellerContact(param: {contactId: any, pageNum: any, pageSize: any, filterName: any, filterPlan: any, filterLevel: any, filterStatus: any}): Promise<any>;
}
declare module "@salesforce/apex/BG_PartnerMerchantDashboardController.getCases" {
  export default function getCases(param: {accountId: any, filterStatus: any, pageNum: any, pageSize: any}): Promise<any>;
}
declare module "@salesforce/apex/BG_PartnerMerchantDashboardController.getOpportunities" {
  export default function getOpportunities(param: {accountId: any, filterStatus: any, pageNum: any, pageSize: any}): Promise<any>;
}
declare module "@salesforce/apex/BG_PartnerMerchantDashboardController.getNotes" {
  export default function getNotes(param: {parentId: any, objectTypeFilter: any, merchantAccountFilter: any, pageNum: any, pageSize: any}): Promise<any>;
}
declare module "@salesforce/apex/BG_PartnerMerchantDashboardController.getResellerContactSummary" {
  export default function getResellerContactSummary(param: {contactId: any}): Promise<any>;
}
declare module "@salesforce/apex/BG_PartnerMerchantDashboardController.getPageSummary" {
  export default function getPageSummary(param: {recordId: any, summaryType: any}): Promise<any>;
}
