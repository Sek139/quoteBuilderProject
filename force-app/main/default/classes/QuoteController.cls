@RestResource(urlMapping='/QuoteController/*')
global with sharing class QuoteController {

    global class LineItemInput {
        public String pricebookEntryId;
        public String productId;
        public String productName;
        public Decimal quantity;
        public Decimal unitPrice;
        public Decimal discount;
        public Decimal totalPrice;
    }

    global class QuoteInput {
        public String quoteName;
        public String customerName;
        public Date expirationDate;
        public List<LineItemInput> lineItems;
        public Decimal subtotal;
        public Decimal discountAmount;
        public Decimal tax;
        public Decimal total;
    }

    global class QuoteResult {
        public String quoteId;
        public Boolean success;
        public String message;
    }

    @HttpPost
    global static QuoteResult saveQuote() {
        QuoteResult result = new QuoteResult();
        try {
            RestRequest req = RestContext.request;
            String body = req.requestBody.toString();
            QuoteInput input = (QuoteInput) JSON.deserialize(body, QuoteInput.class);

            // Find the standard pricebook for associating the quote
            Pricebook2 stdPricebook = [
                SELECT Id FROM Pricebook2 WHERE IsStandard = true LIMIT 1
            ];

            Quote q = new Quote();
            q.Name = String.isBlank(input.quoteName) ? 'New Quote' : input.quoteName;
            q.Pricebook2Id = stdPricebook.Id;
            q.ExpirationDate = input.expirationDate;
            q.Description = 'Customer: ' + (input.customerName ?? '');
            q.Status = 'Draft';
            q.Subtotal = input.subtotal;
            q.TotalPrice = input.total;
            insert q;

            if (input.lineItems != null && !input.lineItems.isEmpty()) {
                List<QuoteLineItem> lines = new List<QuoteLineItem>();
                for (LineItemInput li : input.lineItems) {
                    QuoteLineItem qli = new QuoteLineItem();
                    qli.QuoteId = q.Id;
                    qli.PricebookEntryId = li.pricebookEntryId;
                    qli.Quantity = li.quantity;
                    qli.UnitPrice = li.unitPrice;
                    qli.Discount = li.discount;
                    qli.TotalPrice = li.totalPrice;
                    lines.add(qli);
                }
                insert lines;
            }

            result.quoteId = q.Id;
            result.success = true;
            result.message = 'Quote created successfully';
        } catch (Exception e) {
            result.success = false;
            result.message = e.getMessage();
        }
        return result;
    }
}
