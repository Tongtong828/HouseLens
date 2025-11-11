#  HouseLens: An Interactive Web Platform for Exploring London Housing Market Dynamics
"Data as lens, we see London's housing story"

##  Overview
**HouseLens** is an interactive web platform designed to visualize and explore housing prices across London.  
It allows users to examine spatial and temporal changes in housing affordability between **2021–2025**, leveraging official data from the **UK Land Registry**.

The platform integrates **frontend visualization**, **backend APIs**, and a **MySQL database** to deliver an accessible and data-driven overview of the London housing market.

 **Website:** [https://10.129.111.8](https://10.129.111.8)  
---

## Team Members
| Name | Role & Contributions |
|------|----------------------|
| **Xintong Shao** |  Database creation, frontend interaction design, data visualization, deployment, documentation | 
| **Tianrui Min** |  Data collection and processing, backend API implementation, documentation |
| **Yewei Bian** |  UI design, frontend interface development, documentation |

---

##  Objectives
1. **Data Processing** – Clean and standardize housing transaction data (2021–2025).  
2. **Database Creation** – Build a MySQL database to store transaction details by borough.  
3. **Frontend Design** – Develop a user-friendly and interactive interface for data exploration.  
4. **Data Visualization** – Display heatmaps and five-year price trends using Google Maps and Chart.js.  
5. **Backend Development** – Build RESTful APIs with Node.js/Express to deliver structured data.  
6. **System Integration** – Host the full system with Nginx and PM2 on a Raspberry Pi server.

---

##  System Architecture
HouseLens adopts a **three-layer architecture**:
- **Frontend:** HTML, CSS, JavaScript, Bootstrap, Chart.js, Google Maps API  
- **Backend:** Node.js + Express  
- **Database:** MySQL  
---

##  Key Features
- **Interactive Heatmap:** View borough-level average housing prices with color-coded visualization.  
- **Trend Analysis:** Display five-year price trends dynamically with Chart.js.  
- **Property Details:** Explore individual transactions with detailed info pop-ups.  
- **Filtering System:** Search by borough and price range for comparative analysis.  

---

##  API Endpoints
| Endpoint | Description |
|-----------|--------------|
| `/api/borough-prices` | Returns average property prices by borough |
| `/api/transactions/:borough` | Returns transaction details for a selected borough |
| `/api/borough-trend/:borough` | Returns five-year trend data for a borough |

---

##  Deployment
- **Frontend:** Served by **Nginx** (`/var/www/html/`)  
- **Backend:** Managed with **PM2** for continuous runtime  
- **Server:** Hosted on **Raspberry Pi** (IP: 10.129.111.8)
