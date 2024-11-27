# User stories

---

### **Story:**

"As a box truck dispatcher, I want a unified platform to manage my drivers, find main and partial loads, consult AI for load strategies, and communicate seamlessly with brokers, so I can maximize profitability, save time, and reduce the stress of managing multiple tabs and manual workflows."

---

### **Acceptance Criteria:**

### **Unified Dashboard:**

1. The system aggregates real-time load data from Sylectus and DAT on a single dashboard.
2. Load data is continuously refreshed, eliminating the need for manual updates.
3. Users can filter loads by origin, destination, radius, weight, and dates.

### **Driver and Truck Management:**

1. Users can create and manage driver profiles with truck dimensions and available capacity.
2. Driver assignments and statuses are displayed prominently on the dashboard.

### **Interactive Timeline and Map:**

1. Pickup (PU) and Delivery (DEL) destinations are displayed as a draggable, dynamic timeline of cities.
2. Users can click on a loadboard entry to automatically add its PU and DEL locations to the timeline.
3. A map visualizes the route based on the timeline, with real-time updates and overlays.

### **Load Scoring and Prioritization:**

1. Each load is scored on profitability, partial potential, and route alignment.
2. The system ranks loads to highlight the best main and partial combinations.
3. Users can select the best load plan based on presented scores.

### **AI Consultation:**

1. Each load has a dedicated thread for consulting AI about bidding, profitability, and compatibility with other loads.
2. AI suggests main loads and compatible partials based on truck capacity and scraped load data.
3. Users can ask follow-up questions and refine their strategies in the thread.

### **Automated Broker Communication:**

1. If a load includes an email address, the system generates a prefilled email template to contact the broker.
2. Users can customize the email before sending or use a suggested draft provided by the system.
3. The system logs sent emails for future reference.

### **Scalable and Efficient Workflow:**

1. The platform supports simultaneous load planning for multiple drivers.
2. The system minimizes downtime by suggesting fallback options for future loads.

---

### **Outcome:**

The platform simplifies dispatching by providing a centralized system that optimizes load planning, streamlines communication, and enhances decision-making with AI, ensuring dispatchers can focus on maximizing truck utilization and profitability.

Inspiration for design: PC Miler, https://www.truckrouter.com/