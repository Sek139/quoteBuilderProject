/**
 * Handles Zuora OAuth 2.0 client credentials token lifecycle.
 * Credentials are stored in ZuoraSettings__c custom setting.
 * Token is cached in a static variable for the duration of the request.
 */
public with sharing class ZuoraAuthService {

    private static String cachedToken;
    private static Long tokenExpiresAt;

    public static String getToken() {
        Long nowMs = DateTime.now().getTime();
        if (cachedToken != null && tokenExpiresAt != null && nowMs < tokenExpiresAt) {
            return cachedToken;
        }

        ZuoraConfig__mdt config = [
            SELECT ClientId__c, ClientSecret__c, BaseUrl__c
            FROM ZuoraConfig__mdt
            WHERE DeveloperName = 'Default'
            LIMIT 1
        ];
        String clientId     = config.ClientId__c;
        String clientSecret = config.ClientSecret__c;
        String tokenUrl     = config.BaseUrl__c + '/oauth/token';

        HttpRequest req = new HttpRequest();
        req.setEndpoint(tokenUrl);
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/x-www-form-urlencoded');
        req.setBody(
            'grant_type=client_credentials'
            + '&client_id=' + EncodingUtil.urlEncode(clientId, 'UTF-8')
            + '&client_secret=' + EncodingUtil.urlEncode(clientSecret, 'UTF-8')
        );

        Http http = new Http();
        HttpResponse res = http.send(req);

        if (res.getStatusCode() != 200) {
            throw new ZuoraException('Failed to obtain Zuora token: ' + res.getBody());
        }

        Map<String, Object> body = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
        cachedToken    = (String) body.get('access_token');
        Long expiresIn = (Long) body.get('expires_in');   // seconds
        tokenExpiresAt = nowMs + (expiresIn - 60) * 1000; // 60s safety margin

        return cachedToken;
    }

    public class ZuoraException extends Exception {}
}
