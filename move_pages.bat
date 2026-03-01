mkdir src\app\login
mkdir src\app\(dashboard)\inventory
mkdir src\app\(dashboard)\orders
mkdir src\app\(dashboard)\reports
mkdir src\app\(dashboard)\settings
mkdir src\app\(dashboard)\users

move src\pages\Login.jsx src\app\login\page.jsx
move src\pages\Dashboard.jsx src\app\(dashboard)\page.jsx
move src\pages\Inventory.jsx src\app\(dashboard)\inventory\page.jsx
move src\pages\Orders.jsx src\app\(dashboard)\orders\page.jsx
move src\pages\Reports.jsx src\app\(dashboard)\reports\page.jsx
move src\pages\Settings.jsx src\app\(dashboard)\settings\page.jsx
move src\pages\UserManagement.jsx src\app\(dashboard)\users\page.jsx

rmdir /s /q src\pages
