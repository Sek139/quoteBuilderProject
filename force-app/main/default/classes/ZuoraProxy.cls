/**
 * Apex REST proxy between the React UI Bundle and the Zuora REST API.
 * Injects the OAuth Bearer token so credentials never touch the frontend.
 *
 * GET  /services/apexrest/ZuoraProxy/catalog    → Zuora GET /v1/catalog/products
 * POST /services/apexrest/ZuoraProxy/subscribe  → Zuora POST /v1/subscriptions
 */
@RestResource(urlMapping='/ZuoraProxy/*')
global with sharing class ZuoraProxy {

    // -----------------------------------------------------------------------
    // Inner types matching the Zuora subscription request shape
    // -----------------------------------------------------------------------
    global class ChargeOverride {
        public Integer quantity;
        public Decimal price;
    }

    global class SubscribeRatePlan {
        public String productRatePlanId;
        public List<ChargeOverride> chargeOverrides;
    }

    global class SubscriptionInput {
        public String  accountKey;
        public String  quoteName;
        public String  customerName;
        public String  termType;
        public String  termStartDate;
        public String  termEndDate;
        public List<SubscribeRatePlan> subscribeToRatePlans;
        public Decimal subtotal;
        public Decimal discountAmount;
        public Decimal tax;
        public Decimal total;
    }

    global class ProxyResult {
        public String  subscriptionId;
        public Boolean success;
        public String  message;
    }

    // -----------------------------------------------------------------------
    // GET /catalog — returns Zuora product catalog
    // -----------------------------------------------------------------------
    @HttpGet
    global static void getCatalog() {
        RestResponse res = RestContext.response;
        try {
            ZuoraConfig__mdt config = [SELECT BaseUrl__c FROM ZuoraConfig__mdt WHERE DeveloperName = 'Default' LIMIT 1];
            String catalogUrl = config.BaseUrl__c + '/v1/catalog/products?pageSize=100';
            String token = ZuoraAuthService.getToken();

            HttpRequest req = new HttpRequest();
            req.setEndpoint(catalogUrl);
            req.setMethod('GET');
            req.setHeader('Authorization', 'Bearer ' + token);
            req.setHeader('Content-Type', 'application/json');

            HttpResponse zuoraRes = new Http().send(req);
            res.statusCode = zuoraRes.getStatusCode();
            res.responseBody = Blob.valueOf(zuoraRes.getBody());
        } catch (Exception e) {
            res.statusCode = 500;
            res.responseBody = Blob.valueOf(
                JSON.serialize(new Map<String, String>{ 'error' => e.getMessage() })
            );
        }
    }

    // -----------------------------------------------------------------------
    // POST /subscribe — creates a Zuora subscription
    // -----------------------------------------------------------------------
    @HttpPost
    global static ProxyResult createSubscription() {
        ProxyResult result = new ProxyResult();
        try {
            RestRequest req = RestContext.request;
            SubscriptionInput input = (SubscriptionInput) JSON.deserialize(
                req.requestBody.toString(), SubscriptionInput.class
            );

            ZuoraConfig__mdt config = [SELECT BaseUrl__c FROM ZuoraConfig__mdt WHERE DeveloperName = 'Default' LIMIT 1];
            String subscribeUrl = config.BaseUrl__c + '/v1/subscriptions';
            String token = ZuoraAuthService.getToken();

            // Build Zuora subscription payload
            Map<String, Object> payload = new Map<String, Object>{
                'accountKey'             => input.accountKey,
                'termType'               => input.termType ?? 'TERMED',
                'termStartDate'          => input.termStartDate,
                'contractEffectiveDate'  => input.termStartDate,
                'serviceActivationDate'  => input.termStartDate,
                'subscribeToRatePlans'   => input.subscribeToRatePlans
            };

            HttpRequest zuoraReq = new HttpRequest();
            zuoraReq.setEndpoint(subscribeUrl);
            zuoraReq.setMethod('POST');
            zuoraReq.setHeader('Authorization', 'Bearer ' + token);
            zuoraReq.setHeader('Content-Type', 'application/json');
            zuoraReq.setBody(JSON.serialize(payload));

            HttpResponse zuoraRes = new Http().send(zuoraReq);
            Map<String, Object> body =
                (Map<String, Object>) JSON.deserializeUntyped(zuoraRes.getBody());

            Boolean success = (Boolean) body.get('success');
            result.success        = success == true;
            result.subscriptionId = (String) body.get('subscriptionId');
            result.message        = result.success
                ? 'Subscription created successfully'
                : String.valueOf(body.get('reasons'));

        } catch (Exception e) {
            result.success = false;
            result.message = e.getMessage();
        }
        return result;
    }
}
