# HiSpeed Commercial And Payment Policy

Status: preview implementation contract. This does not activate real payments, credit, vehicle release, document release, seller payment, or purchase.

## Purchase Plans

HiSpeed uses the same underlying vehicle source/purchase cost and shared vehicle identity as NK Cars. HiSpeed applies brand-specific customer selling-price presentation only on the HiSpeed channel.

### Standard Plan

- Customer positioning: best overall vehicle price.
- Calculation: source/purchase cost + 10% HiSpeed sourcing/service margin.
- Payment schedule:
  - 30% deposit to secure the vehicle.
  - 50% top-up before container closing so cumulative paid total reaches 80%.
  - 20% final payment at container closing.
  - 100% paid before release/shipment according to approved operational policy.

### HiSpeed Flex Plan

- Customer positioning: preserve working capital by paying less before shipment.
- Calculation: source/purchase cost + 20% HiSpeed sourcing/service margin.
- Payment schedule:
  - 50% initial payment to secure/start purchase.
  - 20% before shipment.
  - 30% at the approved destination/gateway milestone before controlled vehicle or shipping-document release.
  - 100% complete before the approved release workflow continues.

Flex must never be automatically approved. Supported states are:

- `FLEX_NOT_REQUESTED`
- `FLEX_REQUESTED`
- `FLEX_UNDER_REVIEW`
- `FLEX_APPROVED`
- `FLEX_DECLINED`

Owner or authorized staff approval is required before Flex can become operational for a customer/case/route.

## Customer Presentation

Do not present HiSpeed plans as profit comparison. Customer-facing UI should explain:

- Standard: pay more before shipment and save more overall.
- Flex: pay less before shipment and preserve cash flow, subject to approval.

Permitted transparent explanation:

- English: Vehicle price includes HiSpeed sourcing and service margin.
- Simplified Chinese: 车辆价格已包含 HiSpeed 采购及服务费用。
- Thai: ราคารถรวมค่าจัดหาและบริการของ HiSpeed แล้ว

HiSpeed displays customer money by selected language:

- English: USD
- Simplified Chinese: CNY
- Thai: THB

The authoritative cost basis remains THB. Currency conversion is presentation-only and must use configured HiSpeed FX policy at quote issue.

Do not expose source cost, source URL, seller identity/contact, internal evidence, internal notes, private QNAP identifiers, or internal margin calculations through customer DTOs.

## Inspection Wallet / Credit

Check Availability can occur before paid inspection.

Before physical inspection or travel dispatch:

- New customers must approve/pay inspection and travel.
- Regular customers may use HiSpeed Wallet balance.
- Approved dealer/VIP credit terms require separate Owner-approved policy.

Membership status alone must not grant credit.

If configured by Owner later, part or all of eligible inspection cost may be credited toward a successful vehicle purchase. The credit amount must remain configurable and must not be hard-coded.

## Quotation Snapshot

HiSpeed quotation presentation must snapshot:

- vehicle
- selected payment plan
- vehicle selling price
- inspection/travel
- shipping estimate
- other approved costs
- payment schedule
- FX snapshot
- quote validity

Shipping remains a planning estimate until booking and Owner/authorized confirmation.

## Payment Requests

HiSpeed may generate customer-facing payment request presentations from the selected plan schedule. A request can group one or more vehicles by milestone:

- Secure vehicles: Standard deposit or Flex initial payment.
- Before container closing: Standard top-up to 80% cumulative paid.
- Container closing: Standard final 20%.
- Before shipment: Flex second payment.
- Destination/gateway milestone: Flex remaining balance, only after approved Flex terms and route/legal/document policy.

Payment Requests are not payment confirmation. Customer proof upload, remittance advice, or SWIFT reference is only evidence for Finance review. Status can become confirmed only after authorized Finance staff verify actual received funds.

Real bank instructions must be configured by Owner/Finance and must use the approved HiSpeed company bank account. Preview UI must not display invented account names, bank numbers, payment rails, or payment processor instructions.

Payment Requests must not automate seller payment, purchase, vehicle release, document release, customer financing, or Flex approval.

## Safety Boundaries

The preview does not:

- activate payment movement
- confirm funds
- finance a customer automatically
- pay a seller
- reserve or purchase a vehicle
- release a vehicle or shipping documents
- modify NK Cars pricing
- create a duplicate inventory database
- create a separate QNAP stack or Hermes runtime
