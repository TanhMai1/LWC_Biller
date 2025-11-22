/**
 * @description Unified Apex controller for Partner/Merchant/Reseller Contact Dashboard
 * Serves as the single data access layer for all dashboard LWCs
 */
public with sharing class BG_PartnerMerchantDashboardController {
    
    // ==================== DTOs ====================
    
    public class SearchResultDTO {
        @AuraEnabled public String recordId;
        @AuraEnabled public String name;
        @AuraEnabled public String objectType;
        @AuraEnabled public String recordType; // 'Reseller', 'Merchant', or 'Reseller Contact'
    }
    
    public class ContextDTO {
        @AuraEnabled public String recordId;
        @AuraEnabled public String objectType;
        @AuraEnabled public String dashboardMode; // 'Partner', 'Merchant', 'ResellerContact'
    }
    
    public class PartnerSummaryDTO {
        @AuraEnabled public String accountId;
        @AuraEnabled public String accountName;
        @AuraEnabled public Decimal pluginMonthlyFee;
        @AuraEnabled public String pluginBillTo;
        @AuraEnabled public String techFeeMinimumPlan;
        @AuraEnabled public String achSoldBy;
        // KPIs - Changed to Decimal for numeric fields
        @AuraEnabled public Decimal rapidsSubmitted;
        @AuraEnabled public Date lastRapidDate;
        @AuraEnabled public Decimal activeAccounts;
        @AuraEnabled public Decimal premiumAccountsPercent;
    }
    
    public class MerchantSummaryDTO {
        @AuraEnabled public String accountId;
        @AuraEnabled public String accountName;
        @AuraEnabled public String currentPlanType;
        @AuraEnabled public Decimal level; // Changed to Decimal for numeric Level field
        @AuraEnabled public Date lastTransactionDate;
        @AuraEnabled public String adoptionStatus;
        // Integration Info
        @AuraEnabled public String connectedAccountingSoftware;
        @AuraEnabled public String connectedCCGateway;
        @AuraEnabled public String connectedACHGateway;
        @AuraEnabled public String connectedCheckGateway;
        // Account Team
        @AuraEnabled public String bdrName;
        @AuraEnabled public String sdrName;
        @AuraEnabled public String accountExecutiveName;
        @AuraEnabled public String subscriberSuccessName;
        // Partner Info (for Merchant view)
        @AuraEnabled public Decimal pluginMonthlyFee;
        @AuraEnabled public String pluginBillTo;
        @AuraEnabled public String techFeeMinimumPlan;
        @AuraEnabled public String achSoldBy;
    }
    
    public class ResellerContactDTO {
        @AuraEnabled public String contactId;
        @AuraEnabled public String contactName;
        @AuraEnabled public String email;
        @AuraEnabled public String phone;
        @AuraEnabled public String accountId;
        // KPIs - Decimal for numeric fields
        @AuraEnabled public Decimal rapidsSubmitted;
        @AuraEnabled public Date lastRapidDate;
        @AuraEnabled public Decimal activeAccounts;
        @AuraEnabled public Decimal premiumAccountsPercent;
        // Partner Info (inherited)
        @AuraEnabled public Decimal pluginMonthlyFee;
        @AuraEnabled public String pluginBillTo;
        @AuraEnabled public String techFeeMinimumPlan;
        @AuraEnabled public String achSoldBy;
    }
    
    public class CaseDTO {
        @AuraEnabled public String caseId;
        @AuraEnabled public String caseNumber;
        @AuraEnabled public String caseType;
        @AuraEnabled public String ownerName;
        @AuraEnabled public String status;
        @AuraEnabled public String category;
        @AuraEnabled public String subCategory;
        @AuraEnabled public String summary;
    }
    
    public class OpportunityDTO {
        @AuraEnabled public String opportunityId;
        @AuraEnabled public String name;
        @AuraEnabled public String oppType;
        @AuraEnabled public String stage;
    }
    
    public class NoteDTO {
        @AuraEnabled public String noteId;
        @AuraEnabled public String title;
        @AuraEnabled public String content;
        @AuraEnabled public String parentObjectType;
        @AuraEnabled public String parentName;
        @AuraEnabled public Datetime createdDate;
        @AuraEnabled public String createdByName;
    }
    
    public class PaginatedResultDTO {
        @AuraEnabled public List<Object> records;
        @AuraEnabled public Integer totalCount;
        @AuraEnabled public Integer pageSize;
        @AuraEnabled public Integer currentPage;
        @AuraEnabled public Boolean hasMore;
    }
    
    // ==================== Search Methods ====================
    
    @AuraEnabled(cacheable=true)
    public static List<SearchResultDTO> searchRecords(String searchTerm) {
        List<SearchResultDTO> results = new List<SearchResultDTO>();
        if (String.isBlank(searchTerm) || searchTerm.length() < 2) {
            return results;
        }
        
        String likeTerm = '%' + String.escapeSingleQuotes(searchTerm) + '%';
        
        // Search Accounts (Reseller and Merchant)
        for (Account acc : [
            SELECT Id, Name, Type 
            FROM Account 
            WHERE Name LIKE :likeTerm 
            AND Type IN ('Reseller', 'Merchant')
            LIMIT 10
        ]) {
            SearchResultDTO dto = new SearchResultDTO();
            dto.recordId = acc.Id;
            dto.name = acc.Name;
            dto.objectType = 'Account';
            dto.recordType = acc.Type;
            results.add(dto);
        }
        
        // Search Reseller Contacts - Updated to use Type__c
        for (Contact con : [
            SELECT Id, Name 
            FROM Contact 
            WHERE Name LIKE :likeTerm 
            AND Type__c = 'Reseller'
            LIMIT 10
        ]) {
            SearchResultDTO dto = new SearchResultDTO();
            dto.recordId = con.Id;
            dto.name = con.Name;
            dto.objectType = 'Contact';
            dto.recordType = 'Reseller Contact';
            results.add(dto);
        }
        
        return results;
    }
    
    // ==================== Context Resolution ====================
    
    @AuraEnabled(cacheable=true)
    public static ContextDTO resolveContext(String recordId) {
        ContextDTO ctx = new ContextDTO();
        ctx.recordId = recordId;
        
        if (String.isBlank(recordId)) {
            ctx.dashboardMode = 'Search';
            return ctx;
        }
        
        Id recId = Id.valueOf(recordId);
        String objType = recId.getSObjectType().getDescribe().getName();
        ctx.objectType = objType;
        
        if (objType == 'Account') {
            Account acc = [SELECT Type FROM Account WHERE Id = :recId LIMIT 1];
            ctx.dashboardMode = (acc.Type == 'Reseller') ? 'Partner' : 'Merchant';
        } else if (objType == 'Contact') {
            ctx.dashboardMode = 'ResellerContact';
        }
        
        return ctx;
    }
    
    // ==================== Partner Methods ====================
    
    @AuraEnabled(cacheable=true)
    public static PartnerSummaryDTO getPartnerSummary(String accountId) {
        Account acc = [
            SELECT Id, Name, Plugin_Monthly_Fee__c, Plugin_Bill_To__c, ACH_Sold_By__c,
                   Aggregate_Number_of_Rapids_Submitted__c, Date_of_Last_Rapid__c,
                   Current_Number_of_Active_Accounts__c, Current_Number_of_Premium_Accounts__c
            FROM Account 
            WHERE Id = :accountId AND Type = 'Reseller'
            LIMIT 1
        ];
        
        PartnerSummaryDTO dto = new PartnerSummaryDTO();
        dto.accountId = acc.Id;
        dto.accountName = acc.Name;
        dto.pluginMonthlyFee = acc.Plugin_Monthly_Fee__c;
        dto.pluginBillTo = acc.Plugin_Bill_To__c;
        dto.achSoldBy = acc.ACH_Sold_By__c;
        
        // Get Tech Fee from Addon_Marketplace__c
        dto.techFeeMinimumPlan = getTechFeeMinimumPlan(accountId);
        
        // KPIs from aggregated fields
        dto.rapidsSubmitted = acc.Aggregate_Number_of_Rapids_Submitted__c;
        dto.lastRapidDate = acc.Date_of_Last_Rapid__c;
        dto.activeAccounts = acc.Current_Number_of_Active_Accounts__c;
        
        // Calculate Premium Percentage
        if (acc.Current_Number_of_Active_Accounts__c != null && acc.Current_Number_of_Active_Accounts__c > 0) {
            Decimal premium = acc.Current_Number_of_Premium_Accounts__c != null ? acc.Current_Number_of_Premium_Accounts__c : 0;
            dto.premiumAccountsPercent = (premium / acc.Current_Number_of_Active_Accounts__c) * 100;
        } else {
            dto.premiumAccountsPercent = 0;
        }
        
        return dto;
    }
    
    @AuraEnabled(cacheable=true)
public static PaginatedResultDTO getResellerContacts(String accountId, Integer pageNum, Integer pageSize, String sortField, String sortDir, String searchTerm) {
    Integer offset = (pageNum - 1) * pageSize;
    String orderBy = String.isNotBlank(sortField) ? sortField : 'Name';
    String direction = String.isNotBlank(sortDir) ? sortDir : 'ASC';
    
    // Map sortField to actual API names
    Map<String, String> fieldMap = new Map<String, String>{
        'Name' => 'Name',
        'rapidsSubmitted' => 'Aggregate_Number_of_Rapids_Submitted__c',
        'lastRapidDate' => 'Date_of_Last_Rapid__c',
        'activeAccounts' => 'Current_Number_of_Active_Accounts__c'
    };
    
    String actualField = fieldMap.containsKey(orderBy) ? fieldMap.get(orderBy) : 'Name';
    
    // Build WHERE clause
    String whereClause = 'Parent_Account__c = :accountId AND Type__c = \'Reseller\'';
    
    // Add search filter if provided
    if (String.isNotBlank(searchTerm)) {
        String searchPattern = '%' + String.escapeSingleQuotes(searchTerm) + '%';
        whereClause += ' AND Name LIKE :searchPattern';
    }
    
    // Count query
    String countQuery = 'SELECT COUNT() FROM Contact WHERE ' + whereClause;
    Integer total = Database.countQuery(countQuery);
    
    // Data query
    String query = 'SELECT Id, Name, Email, Phone, Parent_Account__c, ' +
                   'Aggregate_Number_of_Rapids_Submitted__c, Date_of_Last_Rapid__c, ' +
                   'Current_Number_of_Active_Accounts__c, Current_Number_of_Premium_Accounts__c ' +
                   'FROM Contact ' +
                   'WHERE ' + whereClause + ' ' +
                   'ORDER BY ' + actualField + ' ' + direction + ' ' +
                   'LIMIT :pageSize OFFSET :offset';
    
    List<Contact> contacts = Database.query(query);
    List<ResellerContactDTO> dtos = new List<ResellerContactDTO>();
    
    for (Contact c : contacts) {
        ResellerContactDTO dto = new ResellerContactDTO();
        dto.contactId = c.Id;
        dto.contactName = c.Name;
        dto.email = c.Email;
        dto.phone = c.Phone;
        dto.accountId = c.Parent_Account__c;
        
        // KPIs
        dto.rapidsSubmitted = c.Aggregate_Number_of_Rapids_Submitted__c;
        dto.lastRapidDate = c.Date_of_Last_Rapid__c;
        dto.activeAccounts = c.Current_Number_of_Active_Accounts__c;
        
        // Calculate Premium Percentage
        if (c.Current_Number_of_Active_Accounts__c != null && c.Current_Number_of_Active_Accounts__c > 0) {
            Decimal premium = c.Current_Number_of_Premium_Accounts__c != null ? c.Current_Number_of_Premium_Accounts__c : 0;
            dto.premiumAccountsPercent = (premium / c.Current_Number_of_Active_Accounts__c) * 100;
        } else {
            dto.premiumAccountsPercent = 0;
        }
        
        dtos.add(dto);
    }
    
    PaginatedResultDTO result = new PaginatedResultDTO();
    result.records = dtos;
    result.totalCount = total;
    result.pageSize = pageSize;
    result.currentPage = pageNum;
    result.hasMore = (offset + contacts.size()) < total;
    
    return result;
}
    
    // ==================== Merchant Methods ====================
    
    @AuraEnabled(cacheable=true)
    public static MerchantSummaryDTO getMerchantSummary(String accountId) {
        Account acc = [
            SELECT Id, Name, Current_Plan_Type__c, Level__c, Last_Transaction_Date__c,
                   Adoption_Status__c, Connected_Accounting_Software__c,
                   Connected_CC_Gateway__c, Connected_ACH_Gateway__c, Connected_Check_Gateway__c,
                   BDR__r.Name, SDR__r.Name, Account_Executive__r.Name, Subscriber_Success__r.Name,
                   ParentId, Parent.Plugin_Monthly_Fee__c, Parent.Plugin_Bill_To__c, Parent.ACH_Sold_By__c
            FROM Account 
            WHERE Id = :accountId AND Type = 'Merchant'
            LIMIT 1
        ];
        
        MerchantSummaryDTO dto = new MerchantSummaryDTO();
        dto.accountId = acc.Id;
        dto.accountName = acc.Name;
        dto.currentPlanType = acc.Current_Plan_Type__c;
        dto.level = acc.Level__c;
        dto.lastTransactionDate = acc.Last_Transaction_Date__c;
        dto.adoptionStatus = acc.Adoption_Status__c;
        dto.connectedAccountingSoftware = acc.Connected_Accounting_Software__c;
        dto.connectedCCGateway = acc.Connected_CC_Gateway__c;
        dto.connectedACHGateway = acc.Connected_ACH_Gateway__c;
        dto.connectedCheckGateway = acc.Connected_Check_Gateway__c;
        dto.bdrName = acc.BDR__r?.Name;
        dto.sdrName = acc.SDR__r?.Name;
        dto.accountExecutiveName = acc.Account_Executive__r?.Name;
        dto.subscriberSuccessName = acc.Subscriber_Success__r?.Name;
        
        // Partner Information from Parent Account
        if (acc.ParentId != null) {
            dto.pluginMonthlyFee = acc.Parent.Plugin_Monthly_Fee__c;
            dto.pluginBillTo = acc.Parent.Plugin_Bill_To__c;
            dto.achSoldBy = acc.Parent.ACH_Sold_By__c;
            dto.techFeeMinimumPlan = getTechFeeMinimumPlan(acc.ParentId);
        }
        
        return dto;
    }
    
    @AuraEnabled(cacheable=true)
    public static PaginatedResultDTO getMerchantsByResellerContact(String contactId, Integer pageNum, Integer pageSize, String filterName, String filterPlan, String filterLevel, String filterStatus) {
        Integer offset = (pageNum - 1) * pageSize;
        
        String baseQuery = 'SELECT Id, Name, Current_Plan_Type__c, Level__c, Adoption_Status__c ' +
                           'FROM Account WHERE Reseller_Contact__c = :contactId AND Type = \'Merchant\'';
        String countQuery = 'SELECT COUNT() FROM Account WHERE Reseller_Contact__c = :contactId AND Type = \'Merchant\'';
        
        // Apply filters
        if (String.isNotBlank(filterName)) {
            String nameLike = '%' + String.escapeSingleQuotes(filterName) + '%';
            baseQuery += ' AND Name LIKE :nameLike';
            countQuery += ' AND Name LIKE :nameLike';
        }
        if (String.isNotBlank(filterPlan)) {
            baseQuery += ' AND Current_Plan_Type__c = :filterPlan';
            countQuery += ' AND Current_Plan_Type__c = :filterPlan';
        }
        if (String.isNotBlank(filterLevel)) {
            baseQuery += ' AND Level__c = :filterLevel';
            countQuery += ' AND Level__c = :filterLevel';
        }
        if (String.isNotBlank(filterStatus)) {
            baseQuery += ' AND Adoption_Status__c = :filterStatus';
            countQuery += ' AND Adoption_Status__c = :filterStatus';
        }
        
        baseQuery += ' ORDER BY Name ASC LIMIT :pageSize OFFSET :offset';
        
        Integer total = Database.countQuery(countQuery);
        List<Account> merchants = Database.query(baseQuery);
        
        List<MerchantSummaryDTO> dtos = new List<MerchantSummaryDTO>();
        for (Account a : merchants) {
            MerchantSummaryDTO dto = new MerchantSummaryDTO();
            dto.accountId = a.Id;
            dto.accountName = a.Name;
            dto.currentPlanType = a.Current_Plan_Type__c;
            dto.level = a.Level__c;
            dto.adoptionStatus = a.Adoption_Status__c;
            dtos.add(dto);
        }
        
        PaginatedResultDTO result = new PaginatedResultDTO();
        result.records = dtos;
        result.totalCount = total;
        result.pageSize = pageSize;
        result.currentPage = pageNum;
        result.hasMore = (offset + merchants.size()) < total;
        
        return result;
    }
    
    // ==================== Cases Methods ====================
    
    @AuraEnabled(cacheable=true)
    public static PaginatedResultDTO getCases(String accountId, String filterStatus, Integer pageNum, Integer pageSize) {
        Integer offset = (pageNum - 1) * pageSize;
        
        // Updated to include both AccountId and Subscriber_Account_Name__c
        String baseQuery = 'SELECT Id, CaseNumber, Type, Owner.Name, Status, Category__c, Sub_Category__c, Summary__c ' +
                           'FROM Case WHERE (AccountId = :accountId OR Subscriber_Account_Name__c = :accountId)';
        String countQuery = 'SELECT COUNT() FROM Case WHERE (AccountId = :accountId OR Subscriber_Account_Name__c = :accountId)';
        
        if (filterStatus == 'Open') {
            baseQuery += ' AND IsClosed = false';
            countQuery += ' AND IsClosed = false';
        } else if (filterStatus == 'Closed') {
            baseQuery += ' AND IsClosed = true';
            countQuery += ' AND IsClosed = true';
        }
        
        baseQuery += ' ORDER BY CreatedDate DESC LIMIT :pageSize OFFSET :offset';
        
        Integer total = Database.countQuery(countQuery);
        List<Case> cases = Database.query(baseQuery);
        
        List<CaseDTO> dtos = new List<CaseDTO>();
        for (Case c : cases) {
            CaseDTO dto = new CaseDTO();
            dto.caseId = c.Id;
            dto.caseNumber = c.CaseNumber;
            dto.caseType = c.Type;
            dto.ownerName = c.Owner.Name;
            dto.status = c.Status;
            dto.category = c.Category__c;
            dto.subCategory = c.Sub_Category__c;
            dto.summary = c.Summary__c;
            dtos.add(dto);
        }
        
        PaginatedResultDTO result = new PaginatedResultDTO();
        result.records = dtos;
        result.totalCount = total;
        result.pageSize = pageSize;
        result.currentPage = pageNum;
        result.hasMore = (offset + cases.size()) < total;
        
        return result;
    }
    
    // ==================== Opportunities Methods ====================
    
    @AuraEnabled(cacheable=true)
    public static PaginatedResultDTO getOpportunities(String accountId, String filterStatus, Integer pageNum, Integer pageSize) {
        Integer offset = (pageNum - 1) * pageSize;
        
        String baseQuery = 'SELECT Id, Name, Type, StageName FROM Opportunity WHERE AccountId = :accountId';
        String countQuery = 'SELECT COUNT() FROM Opportunity WHERE AccountId = :accountId';
        
        if (filterStatus == 'Open') {
            baseQuery += ' AND IsClosed = false';
            countQuery += ' AND IsClosed = false';
        } else if (filterStatus == 'Closed') {
            baseQuery += ' AND IsClosed = true';
            countQuery += ' AND IsClosed = true';
        }
        
        baseQuery += ' ORDER BY CreatedDate DESC LIMIT :pageSize OFFSET :offset';
        
        Integer total = Database.countQuery(countQuery);
        List<Opportunity> opps = Database.query(baseQuery);
        
        List<OpportunityDTO> dtos = new List<OpportunityDTO>();
        for (Opportunity o : opps) {
            OpportunityDTO dto = new OpportunityDTO();
            dto.opportunityId = o.Id;
            dto.name = o.Name;
            dto.oppType = o.Type;
            dto.stage = o.StageName;
            dtos.add(dto);
        }
        
        PaginatedResultDTO result = new PaginatedResultDTO();
        result.records = dtos;
        result.totalCount = total;
        result.pageSize = pageSize;
        result.currentPage = pageNum;
        result.hasMore = (offset + opps.size()) < total;
        
        return result;
    }
    
    // ==================== Notes Methods ====================
    
    @AuraEnabled(cacheable=true)
    public static PaginatedResultDTO getNotes(String parentId, String objectTypeFilter, String merchantAccountFilter, Integer pageNum, Integer pageSize) {
        Integer offset = (pageNum - 1) * pageSize;
        
        Set<Id> linkedEntityIds = new Set<Id>();
        
        if (String.isNotBlank(parentId)) {
            linkedEntityIds.add(Id.valueOf(parentId));
            
            Id pId = Id.valueOf(parentId);
            String objType = pId.getSObjectType().getDescribe().getName();
            
            // If Account (Partner or Merchant), get related Cases and Opportunities
            if (objType == 'Account') {
                // Get Cases related to this account
                for (Case c : [SELECT Id FROM Case WHERE AccountId = :parentId OR Subscriber_Account_Name__c = :parentId]) {
                    linkedEntityIds.add(c.Id);
                }
                // Get Opportunities
                for (Opportunity o : [SELECT Id FROM Opportunity WHERE AccountId = :parentId]) {
                    linkedEntityIds.add(o.Id);
                }
                
                // If Partner Account, also get notes from related Merchant Accounts
                Account acc = [SELECT Type FROM Account WHERE Id = :parentId LIMIT 1];
                if (acc.Type == 'Reseller') {
                    for (Account merchant : [SELECT Id FROM Account WHERE ParentId = :parentId AND Type = 'Merchant']) {
                        linkedEntityIds.add(merchant.Id);
                        // Get Cases and Opps for each merchant
                        for (Case c : [SELECT Id FROM Case WHERE AccountId = :merchant.Id OR Subscriber_Account_Name__c = :merchant.Id]) {
                            linkedEntityIds.add(c.Id);
                        }
                        for (Opportunity o : [SELECT Id FROM Opportunity WHERE AccountId = :merchant.Id]) {
                            linkedEntityIds.add(o.Id);
                        }
                    }
                }
            } 
            // If Contact, get related Merchant Accounts, their Cases and Opportunities
            else if (objType == 'Contact') {
                for (Account merchant : [SELECT Id FROM Account WHERE Reseller_Contact__c = :parentId]) {
                    linkedEntityIds.add(merchant.Id);
                    // Get Cases and Opps
                    for (Case c : [SELECT Id FROM Case WHERE AccountId = :merchant.Id OR Subscriber_Account_Name__c = :merchant.Id]) {
                        linkedEntityIds.add(c.Id);
                    }
                    for (Opportunity o : [SELECT Id FROM Opportunity WHERE AccountId = :merchant.Id]) {
                        linkedEntityIds.add(o.Id);
                    }
                }
            }
        }
        
        // Apply merchant account filter if provided
        if (String.isNotBlank(merchantAccountFilter)) {
            Id merchantId = Id.valueOf(merchantAccountFilter);
            Set<Id> filteredIds = new Set<Id>{merchantId};
            
            // Add Cases and Opps for this specific merchant
            for (Case c : [SELECT Id FROM Case WHERE AccountId = :merchantId OR Subscriber_Account_Name__c = :merchantId]) {
                filteredIds.add(c.Id);
            }
            for (Opportunity o : [SELECT Id FROM Opportunity WHERE AccountId = :merchantId]) {
                filteredIds.add(o.Id);
            }
            
            linkedEntityIds = filteredIds;
        }
        
        if (linkedEntityIds.isEmpty()) {
            PaginatedResultDTO emptyResult = new PaginatedResultDTO();
            emptyResult.records = new List<Object>();
            emptyResult.totalCount = 0;
            emptyResult.pageSize = pageSize;
            emptyResult.currentPage = pageNum;
            emptyResult.hasMore = false;
            return emptyResult;
        }
        
        List<ContentDocumentLink> links = [
            SELECT ContentDocumentId, LinkedEntityId 
            FROM ContentDocumentLink 
            WHERE LinkedEntityId IN :linkedEntityIds
        ];
        
        Set<Id> docIds = new Set<Id>();
        Map<Id, Id> docToEntity = new Map<Id, Id>();
        for (ContentDocumentLink l : links) {
            docIds.add(l.ContentDocumentId);
            docToEntity.put(l.ContentDocumentId, l.LinkedEntityId);
        }
        
        if (docIds.isEmpty()) {
            PaginatedResultDTO emptyResult = new PaginatedResultDTO();
            emptyResult.records = new List<Object>();
            emptyResult.totalCount = 0;
            emptyResult.pageSize = pageSize;
            emptyResult.currentPage = pageNum;
            emptyResult.hasMore = false;
            return emptyResult;
        }
        
        // Apply object type filter
        Set<Id> filteredDocIds = docIds;
        if (String.isNotBlank(objectTypeFilter)) {
            filteredDocIds = new Set<Id>();
            for (Id docId : docIds) {
                Id entityId = docToEntity.get(docId);
                if (entityId != null) {
                    String entityType = entityId.getSObjectType().getDescribe().getName();
                    if (entityType == objectTypeFilter) {
                        filteredDocIds.add(docId);
                    }
                }
            }
        }
        
        Integer total = [SELECT COUNT() FROM ContentNote WHERE Id IN :filteredDocIds];
        
        List<ContentNote> notes = [
            SELECT Id, Title, TextPreview, CreatedDate, CreatedBy.Name
            FROM ContentNote 
            WHERE Id IN :filteredDocIds
            ORDER BY CreatedDate DESC
            LIMIT :pageSize OFFSET :offset
        ];
        
        // Get parent names for display
        Set<Id> entityIds = new Set<Id>();
        for (ContentNote n : notes) {
            Id entityId = docToEntity.get(n.Id);
            if (entityId != null) {
                entityIds.add(entityId);
            }
        }
        
        Map<Id, String> entityNames = new Map<Id, String>();
        for (Account a : [SELECT Id, Name FROM Account WHERE Id IN :entityIds]) {
            entityNames.put(a.Id, a.Name);
        }
        for (Case c : [SELECT Id, CaseNumber FROM Case WHERE Id IN :entityIds]) {
            entityNames.put(c.Id, 'Case ' + c.CaseNumber);
        }
        for (Opportunity o : [SELECT Id, Name FROM Opportunity WHERE Id IN :entityIds]) {
            entityNames.put(o.Id, o.Name);
        }
        for (Contact con : [SELECT Id, Name FROM Contact WHERE Id IN :entityIds]) {
            entityNames.put(con.Id, con.Name);
        }
        
        List<NoteDTO> dtos = new List<NoteDTO>();
        for (ContentNote n : notes) {
            NoteDTO dto = new NoteDTO();
            dto.noteId = n.Id;
            dto.title = n.Title;
            dto.content = n.TextPreview;
            dto.createdDate = n.CreatedDate;
            dto.createdByName = n.CreatedBy.Name;
            
            Id entityId = docToEntity.get(n.Id);
            if (entityId != null) {
                dto.parentObjectType = entityId.getSObjectType().getDescribe().getName();
                dto.parentName = entityNames.get(entityId);
            }
            dtos.add(dto);
        }
        
        PaginatedResultDTO result = new PaginatedResultDTO();
        result.records = dtos;
        result.totalCount = total;
        result.pageSize = pageSize;
        result.currentPage = pageNum;
        result.hasMore = (offset + notes.size()) < total;
        
        return result;
    }
    
    // ==================== Reseller Contact Methods ====================
    
    @AuraEnabled(cacheable=true)
    public static ResellerContactDTO getResellerContactSummary(String contactId) {
        Contact con = [
            SELECT Id, Name, Email, Phone, Parent_Account__c,
                   Parent_Account__r.Plugin_Monthly_Fee__c, Parent_Account__r.Plugin_Bill_To__c,
                   Parent_Account__r.ACH_Sold_By__c,
                   Aggregate_Number_of_Rapids_Submitted__c, Date_of_Last_Rapid__c,
                   Current_Number_of_Active_Accounts__c, Current_Number_of_Premium_Accounts__c
            FROM Contact 
            WHERE Id = :contactId AND Type__c = 'Reseller'
            LIMIT 1
        ];
        
        ResellerContactDTO dto = new ResellerContactDTO();
        dto.contactId = con.Id;
        dto.contactName = con.Name;
        dto.email = con.Email;
        dto.phone = con.Phone;
        dto.accountId = con.Parent_Account__c;
        
        // Partner info from parent Account
        dto.pluginMonthlyFee = con.Parent_Account__r?.Plugin_Monthly_Fee__c;
        dto.pluginBillTo = con.Parent_Account__r?.Plugin_Bill_To__c;
        dto.achSoldBy = con.Parent_Account__r?.ACH_Sold_By__c;
        
        // Get Tech Fee if parent account exists
        if (con.Parent_Account__c != null) {
            dto.techFeeMinimumPlan = getTechFeeMinimumPlan(con.Parent_Account__c);
        }
        
        // KPIs
        dto.rapidsSubmitted = con.Aggregate_Number_of_Rapids_Submitted__c;
        dto.lastRapidDate = con.Date_of_Last_Rapid__c;
        dto.activeAccounts = con.Current_Number_of_Active_Accounts__c;
        
        // Calculate Premium Percentage
        if (con.Current_Number_of_Active_Accounts__c != null && con.Current_Number_of_Active_Accounts__c > 0) {
            Decimal premium = con.Current_Number_of_Premium_Accounts__c != null ? con.Current_Number_of_Premium_Accounts__c : 0;
            dto.premiumAccountsPercent = (premium / con.Current_Number_of_Active_Accounts__c) * 100;
        } else {
            dto.premiumAccountsPercent = 0;
        }
        
        return dto;
    }
    
    // ==================== Page Summary Methods ====================
    
    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getPageSummary(String recordId, String summaryType) {
        Map<String, Object> result = new Map<String, Object>();
        
        switch on summaryType {
            when 'PartnerInfo' {
                PartnerSummaryDTO dto = getPartnerSummary(recordId);
                result.put('data', dto);
            }
            when 'MerchantSummary' {
                MerchantSummaryDTO dto = getMerchantSummary(recordId);
                result.put('data', dto);
            }
            when 'ResellerContactKPI' {
                ResellerContactDTO dto = getResellerContactSummary(recordId);
                result.put('data', dto);
            }
        }
        
        return result;
    }
    
    // ==================== Helper Methods ====================
    
    /**
     * Returns the Minimum_Plan_Required__c from the most recent Technology Fees addon
     * @param resellerAccountId The Reseller Account Id
     * @return String The minimum plan required, or 'N/A' if not found
     */
    private static String getTechFeeMinimumPlan(String resellerAccountId) {
        try {
            List<Addon_Marketplace__c> addons = [
                SELECT Minimum_Plan_Required__c
                FROM Addon_Marketplace__c
                WHERE Reseller_Account__c = :resellerAccountId
                AND Type__c = 'Technology Fees'
                ORDER BY CreatedDate DESC
                LIMIT 1
            ];
            
            if (!addons.isEmpty() && addons[0].Minimum_Plan_Required__c != null) {
                return addons[0].Minimum_Plan_Required__c;
            }
        } catch (Exception e) {
            System.debug('Error retrieving Tech Fee Minimum Plan: ' + e.getMessage());
        }
        
        return 'N/A';