# 🏭 Inventra / Oscar — Factory Manufacturing & Production Workflow Guide (Thanglish)

---

## 📋 Table of Contents (Poruladakkam)
1. [Overall Factory Flow Chart (Urpathi & Virpani Cycle)](#1-overall-factory-flow-chart-urpathi--virpani-cycle)
2. [Phase 1: Factory Master Setup (Raw Materials, Gas & Finished Goods)](#phase-1-factory-master-setup-raw-materials-gas--finished-goods)
3. [Phase 2: Recipe / Bill of Materials (BOM Formula Amaippu)](#phase-2-recipe--bill-of-materials-bom-formula-amaippu)
4. [Phase 3: Sourcing Raw Materials (Vendor kitta Gas & Materials Vaanguradhu)](#phase-3-sourcing-raw-materials-vendor-kitta-gas--materials-vaanguradhu)
5. [Phase 4: Factory Production Run (Sarakku Thayarithu Stock Yethuradhu)](#phase-4-factory-production-run-sarakku-thayarithu-stock-yethuradhu)
6. [Phase 5: Selling Finished Goods (Customer-ku Autoflex Sarakku Virpadhu)](#phase-5-selling-finished-goods-customer-ku-autoflex-sarakku-virpadhu)
7. [Phase 6: Live Factory Analytics & "Can-Produce" Calculator](#phase-6-live-factory-analytics--can-produce-calculator)

---

## 1. Overall Factory Flow Chart (Urpathi & Virpani Cycle)

```mermaid
flowchart TD
    subgraph Sourcing ["1. Purchase from Vendors"]
        V["Vendors / Suppliers"] -->|PO & Bill| RM["Raw Materials & Gas Consumables<br/>(Wire Rods, Chemical Flux, Gas Cylinders, Boxes)"]
    end

    subgraph Factory ["2. Factory Floor (Manufacturing / BOM)"]
        RM -->|Automatic Stock Deduct (-)| BOM["Recipe / Bill of Materials<br/>+ Machine Power & Labor Cost"]
        BOM -->|Automatic Stock Add (+)| FG["Finished Goods (Final Product)<br/>(Autoflex Welding Materials / Pencil)"]
    end

    subgraph Selling ["3. Sales to Customers"]
        FG -->|Invoice & Dispatch| C["Clients / Customers"]
    end

    subgraph Reports ["4. Live Factory Monitoring"]
        BOM -.-> R["Can-Produce Calculator & Stock Bottlenecks<br/>(Ethana box Autoflex seiya mudiyum?)"]
    end
```

---

## Phase 1: Factory Master Setup (Raw Materials, Gas & Finished Goods)

Factory-la 3 vidhamana items irukku:
1. **🏭 Raw Material**: Neenga vendor kitta vaangum moolap porul (Eg: Raw Wire Rod 3mm, Steel plate, Graphite/Wood).
2. **⚡ Consumable**: Production nadakkum bothu use aagura gas / chemicals (Eg: Argon Shielding Gas, Flux Chemical, Packing carton).
3. **📦 Finished Good**: Neenga factory-la thayarikkum mudivu porul (Eg: **Autoflex Welding Material Box**, Pencil pack). Idhai mattum dhaan customer-ku vippeenga!

### Item Create Panradhu:
* **Menu**: Left Sidebar ➔ **Products** ➔ **"+ New Item"**.
* **Classification**:
  * Select `Raw Material` or `Consumable` for materials you buy.
  * Select `Finished Good` for products your factory produces.
* **Filter Tabs**: Page top-la irukkum `📦 Finished Goods` or `🏭 Raw Materials & Gas` click panni theliva paarkalam.

---

## Phase 2: Recipe / Bill of Materials (BOM Formula Amaippu)

Oru Final Product (Eg: Autoflex Welding Material Box) thayarikka enna enna theva nu formula set panradhu:

1. **Products** page-la unga **Finished Good** pakkathula irukkum **`🥣 + Set Recipe`** button click pannunga.
2. Thevaiyana ingredients add pannunga:
   * **Raw Steel Wire Rod**: `2 kg` (Cost: ₹130)
   * **Flux Chemical**: `0.3 kg` (Cost: ₹45)
   * **Argon Shielding Gas**: `0.05 Cylinder` (Cost: ₹42.50)
   * **Packaging Box**: `1 Box` (Cost: ₹15)
3. Screen-la automatic-ah **Raw Material Cost / Unit = ₹232.50**, **Selling Price = ₹450**, **Gross Margin = 48.3%** nu live calculation kaatum.
4. **"Save Recipe Formula"** click panni save pannidunga.

---

## Phase 3: Sourcing Raw Materials (Vendor kitta Gas & Materials Vaanguradhu)

Production start panna raw materials kai-la irukkanum:

1. **Purchase Orders (PO)**:
   * **Purchases** ➔ **Purchase Orders** ➔ **"+ New PO"**.
   * Supplier select pannunga.
   * Product dropdown-la automatic-ah **`🏭 [Raw Material]`** and **`⚡ [Consumable]`** first highlight aagum.
2. **Receive Stock (GRN)**:
   * Sarakku kai vandhadhum **"Receive Stock"** click pannunga.
   * Ungal Factory Godown-la raw materials and gas count yeridum (+).
3. **Vendor Bill**: Supplier bill entry pottu payment mudikalam.

---

## Phase 4: Factory Production Run (Sarakku Thayarithu Stock Yethuradhu)

Factory floor-la sarakku thayaricha udane:

1. **Left Menu** ➔ **Manufacturing** ➔ **"Production & BOM"** page-ku ponga.
2. **Finished Good to Produce**: Select `Autoflex Welding Material`.
3. **Factory Warehouse**: Select `Main Factory Godown`.
4. **Units to Produce**: Enter `50 Boxes`.
5. **Labor & Power Cost (Optional)**: Enter `Labor: ₹1,500`, `Machine/Power: ₹500`.
6. Screen-la **Required Raw Materials for 50 Units** table live-ah kaatum:
   * 100 kg Wire Rod (Stock: 400 kg ➔ `✓ In Stock`)
   * 15 kg Flux (Stock: 80 kg ➔ `✓ In Stock`)
   * 2.5 Gas Cylinders (Stock: 10 Cylinders ➔ `✓ In Stock`)
7. **"🚀 Produce 50 Units & Deduct Stock"** button-ai click pannunga!
   * **Instant Database Mutation**:
     * Godown-la irundhu 100 kg Wire, 15 kg Flux, 2.5 Gas **Minus (-) aagidum**.
     * 50 Boxes Autoflex Welding Material **Plus (+) aagi stock yeridum**.
     * Batch Run Number generate aagum (Eg: `PROD-839201`).

---

## Phase 5: Selling Finished Goods (Customer-ku Autoflex Sarakku Virpadhu)

Customer kitta irundhu order vandhadhum:

1. **Sales Orders** / **Estimates** ➔ **"+ New Order"**.
2. Product select pannum bothu automatic-ah **`📦 [Finished Good] Autoflex Welding Material`** mattum display aagum.
3. Raw materials (wire rod, gas cylinder) yaarum mistake-ah customer-ku bill poda mudiyadhu!
4. Order confirm panni delivery anuppum bothu finished goods stock automatically deduct aagi invoice generate aagum.

---

## Phase 6: Live Factory Analytics & "Can-Produce" Calculator

### 📊 Manufacturing Control Center:
* **Can-Produce Calculator**: Godown-la ippo kai-la irukkum wire, flux, and gas cylinders vechu **"Innum evlo units Autoflex seiya mudiyum?"** nu live-ah screen-la kaatum.
* **Bottleneck Alerts**: "Argon Gas low-ah irukku! Gas vangina dhaan innum 20 box produce panna mudiyum" nu warning screen-laye red alert kaatum.
* **Batch History Audit**: Ovvoru production batch-um enna date-la yar thayaricha, evlo unit cost aachu nu full audit record maintain aagum.

---
*Inventra / Oscar Factory ERP — Dedicated Manufacturing Edition*
