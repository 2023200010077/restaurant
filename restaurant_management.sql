-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 21, 2026 at 07:46 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `restaurant_management`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `get_restaurant_statistics` (IN `p_restaurant_id` INT)   BEGIN
    SELECT
        r.restaurant_id,
        r.restaurant_name,

        (
            SELECT COUNT(*)
            FROM employee e
            WHERE e.restaurant_id = r.restaurant_id
        ) AS total_employees,

        (
            SELECT COUNT(*)
            FROM restaurant_tables rt
            WHERE rt.restaurant_id = r.restaurant_id
        ) AS total_tables,

        (
            SELECT COUNT(*)
            FROM orders o
            WHERE o.restaurant_id = r.restaurant_id
        ) AS total_orders,

        (
            SELECT COALESCE(SUM(p.payment_amount), 0)
            FROM payment p
            INNER JOIN orders o
                ON p.order_id = o.order_id
            WHERE o.restaurant_id = r.restaurant_id
              AND p.payment_status = 'paid'
        ) AS total_revenue

    FROM restaurant r
    WHERE r.restaurant_id = p_restaurant_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `recalculate_order_total` (IN `p_order_id` INT)   BEGIN
    UPDATE orders
    SET total_amount = (
        SELECT COALESCE(SUM(subtotal), 0)
        FROM order_item
        WHERE order_id = p_order_id
    )
    WHERE order_id = p_order_id;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `category`
--

CREATE TABLE `category` (
  `category_id` int(11) NOT NULL,
  `category_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `category`
--

INSERT INTO `category` (`category_id`, `category_name`, `description`) VALUES
(1, 'Main Course', 'Main meals and rice-based dishes'),
(2, 'Appetizers', 'Starters and small dishes'),
(3, 'Beverages', 'Hot and cold drinks'),
(4, 'Dessertss', 'Sweet dishes and desserts');

-- --------------------------------------------------------

--
-- Table structure for table `customer`
--

CREATE TABLE `customer` (
  `customer_id` int(11) NOT NULL,
  `customer_name` varchar(150) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `registration_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `customer`
--

INSERT INTO `customer` (`customer_id`, `customer_name`, `email`, `phone`, `address`, `registration_date`) VALUES
(1, 'John Rahman', 'john@example.com', '01712000001', 'Dhaka', '2026-09-20 17:06:37'),
(2, 'Ayesha Karim', 'ayesha@example.com', '01712000002', 'Dhaka', '2026-09-20 17:06:37'),
(3, 'Tanvir Hossain', 'tanvir@example.com', '01712000003', 'Chittagong', '2026-09-20 17:06:37'),
(4, 'Mim Akter', 'mim@example.com', '01712000004', 'Dhaka', '2026-09-20 17:06:37');

-- --------------------------------------------------------

--
-- Table structure for table `employee`
--

CREATE TABLE `employee` (
  `employee_id` int(11) NOT NULL,
  `restaurant_id` int(11) NOT NULL,
  `employee_name` varchar(150) NOT NULL,
  `designation` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `salary` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `employee`
--

INSERT INTO `employee` (`employee_id`, `restaurant_id`, `employee_name`, `designation`, `phone`, `salary`) VALUES
(1, 1, 'Rahim Ahmed', 'Manager', '01711000001', 45000.00),
(2, 1, 'Karim Hasan', 'Chef', '01711000002', 30000.00),
(3, 2, 'Nusrat Jahan', 'Manager', '01711000003', 42000.00),
(4, 2, 'Sakib Khan', 'Waiter', '01711000004', 18000.00);

-- --------------------------------------------------------

--
-- Table structure for table `menu_item`
--

CREATE TABLE `menu_item` (
  `item_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `item_name` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `availability` tinyint(1) DEFAULT 1,
  `preparation_time` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `menu_item`
--

INSERT INTO `menu_item` (`item_id`, `category_id`, `item_name`, `description`, `price`, `availability`, `preparation_time`) VALUES
(1, 1, 'Chicken Biryani', 'Traditional chicken biryani', 250.00, 1, 25),
(2, 1, 'Beef Curry', 'Spicy beef curry', 320.00, 1, 35),
(3, 2, 'Chicken Wings', 'Fried chicken wings', 180.00, 1, 15),
(4, 3, 'Fresh Lime Juice', 'Fresh lime drink', 80.00, 1, 5),
(5, 3, 'Coffee', 'Hot brewed coffee', 120.00, 1, 8);

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `order_id` int(11) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `restaurant_id` int(11) NOT NULL,
  `table_id` int(11) DEFAULT NULL,
  `employee_id` int(11) DEFAULT NULL,
  `order_date` date NOT NULL,
  `order_time` time NOT NULL,
  `order_type` enum('dine_in','takeaway','delivery') NOT NULL,
  `order_status` enum('pending','preparing','ready','completed','cancelled') DEFAULT 'pending',
  `total_amount` decimal(10,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`order_id`, `customer_id`, `restaurant_id`, `table_id`, `employee_id`, `order_date`, `order_time`, `order_type`, `order_status`, `total_amount`) VALUES
(2, 4, 2, 4, 4, '2026-09-20', '16:59:00', 'dine_in', 'ready', 2400.00);

-- --------------------------------------------------------

--
-- Table structure for table `order_item`
--

CREATE TABLE `order_item` (
  `order_item_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_item`
--

INSERT INTO `order_item` (`order_item_id`, `order_id`, `item_id`, `quantity`, `unit_price`, `subtotal`) VALUES
(3, 2, 4, 20, 120.00, 2400.00);

--
-- Triggers `order_item`
--
DELIMITER $$
CREATE TRIGGER `after_order_item_delete` AFTER DELETE ON `order_item` FOR EACH ROW BEGIN
    CALL recalculate_order_total(OLD.order_id);
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `after_order_item_insert` AFTER INSERT ON `order_item` FOR EACH ROW BEGIN
    CALL recalculate_order_total(NEW.order_id);
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `after_order_item_update` AFTER UPDATE ON `order_item` FOR EACH ROW BEGIN
    IF OLD.order_id <> NEW.order_id THEN
        CALL recalculate_order_total(OLD.order_id);
    END IF;

    CALL recalculate_order_total(NEW.order_id);
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_order_item_insert` BEFORE INSERT ON `order_item` FOR EACH ROW BEGIN
    IF NEW.quantity <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Quantity must be greater than zero';
    END IF;

    IF NEW.unit_price < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Unit price cannot be negative';
    END IF;

    SET NEW.subtotal =
        NEW.quantity * NEW.unit_price;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_order_item_update` BEFORE UPDATE ON `order_item` FOR EACH ROW BEGIN
    IF NEW.quantity <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Quantity must be greater than zero';
    END IF;

    IF NEW.unit_price < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Unit price cannot be negative';
    END IF;

    SET NEW.subtotal =
        NEW.quantity * NEW.unit_price;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `payment`
--

CREATE TABLE `payment` (
  `payment_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `payment_method` enum('cash','card','mobile_banking','other') NOT NULL,
  `payment_amount` decimal(10,2) NOT NULL,
  `payment_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `payment_status` enum('pending','paid','refunded','failed') DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payment`
--

INSERT INTO `payment` (`payment_id`, `order_id`, `payment_method`, `payment_amount`, `payment_date`, `payment_status`) VALUES
(1, 2, 'mobile_banking', 2400.00, '2026-09-18 18:00:00', 'paid');

-- --------------------------------------------------------

--
-- Table structure for table `reservation`
--

CREATE TABLE `reservation` (
  `reservation_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `table_id` int(11) NOT NULL,
  `reservation_date` date NOT NULL,
  `reservation_time` time NOT NULL,
  `party_size` int(11) NOT NULL,
  `reservation_status` enum('pending','confirmed','completed','cancelled','no_show') DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `reservation`
--

INSERT INTO `reservation` (`reservation_id`, `customer_id`, `table_id`, `reservation_date`, `reservation_time`, `party_size`, `reservation_status`) VALUES
(3, 4, 1, '2026-09-17', '23:02:00', 1, 'confirmed');

-- --------------------------------------------------------

--
-- Table structure for table `restaurant`
--

CREATE TABLE `restaurant` (
  `restaurant_id` int(11) NOT NULL,
  `restaurant_name` varchar(150) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `opening_time` time DEFAULT NULL,
  `closing_time` time DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `restaurant`
--

INSERT INTO `restaurant` (`restaurant_id`, `restaurant_name`, `address`, `city`, `phone`, `opening_time`, `closing_time`, `created_at`) VALUES
(1, 'Spice Garden', '12 Main Road', 'Dhaka', '01710000001', '10:00:00', '22:00:00', '2026-09-20 16:52:18'),
(2, 'The Food House', '25 University Avenue', 'Dhaka', '01710000002', '09:00:00', '23:00:00', '2026-09-20 16:52:18'),
(3, 'Green Leaf Restaurant', '8 Lake Road', 'Chittagong', '01710000003', '11:00:00', '22:30:00', '2026-09-20 16:52:18');

-- --------------------------------------------------------

--
-- Stand-in structure for view `restaurant_summary`
-- (See below for the actual view)
--
CREATE TABLE `restaurant_summary` (
`restaurant_id` int(11)
,`restaurant_name` varchar(150)
,`city` varchar(100)
,`phone` varchar(20)
,`opening_time` time
,`closing_time` time
,`total_employees` bigint(21)
,`total_tables` bigint(21)
);

-- --------------------------------------------------------

--
-- Table structure for table `restaurant_tables`
--

CREATE TABLE `restaurant_tables` (
  `table_id` int(11) NOT NULL,
  `restaurant_id` int(11) NOT NULL,
  `table_number` varchar(20) NOT NULL,
  `capacity` int(11) NOT NULL,
  `table_status` enum('available','occupied','reserved','maintenance') DEFAULT 'available'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `restaurant_tables`
--

INSERT INTO `restaurant_tables` (`table_id`, `restaurant_id`, `table_number`, `capacity`, `table_status`) VALUES
(1, 1, 'T1', 2, 'available'),
(2, 1, 'T2', 4, 'available'),
(3, 1, 'T3', 6, 'available'),
(4, 2, 'T1', 2, 'available'),
(5, 2, 'T2', 4, 'available');

-- --------------------------------------------------------

--
-- Structure for view `restaurant_summary`
--
DROP TABLE IF EXISTS `restaurant_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `restaurant_summary`  AS SELECT `r`.`restaurant_id` AS `restaurant_id`, `r`.`restaurant_name` AS `restaurant_name`, `r`.`city` AS `city`, `r`.`phone` AS `phone`, `r`.`opening_time` AS `opening_time`, `r`.`closing_time` AS `closing_time`, count(distinct `e`.`employee_id`) AS `total_employees`, count(distinct `rt`.`table_id`) AS `total_tables` FROM ((`restaurant` `r` left join `employee` `e` on(`r`.`restaurant_id` = `e`.`restaurant_id`)) left join `restaurant_tables` `rt` on(`r`.`restaurant_id` = `rt`.`restaurant_id`)) GROUP BY `r`.`restaurant_id`, `r`.`restaurant_name`, `r`.`city`, `r`.`phone`, `r`.`opening_time`, `r`.`closing_time` ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `category`
--
ALTER TABLE `category`
  ADD PRIMARY KEY (`category_id`);

--
-- Indexes for table `customer`
--
ALTER TABLE `customer`
  ADD PRIMARY KEY (`customer_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `employee`
--
ALTER TABLE `employee`
  ADD PRIMARY KEY (`employee_id`),
  ADD KEY `restaurant_id` (`restaurant_id`);

--
-- Indexes for table `menu_item`
--
ALTER TABLE `menu_item`
  ADD PRIMARY KEY (`item_id`),
  ADD KEY `category_id` (`category_id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`order_id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `restaurant_id` (`restaurant_id`),
  ADD KEY `table_id` (`table_id`),
  ADD KEY `employee_id` (`employee_id`);

--
-- Indexes for table `order_item`
--
ALTER TABLE `order_item`
  ADD PRIMARY KEY (`order_item_id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `item_id` (`item_id`);

--
-- Indexes for table `payment`
--
ALTER TABLE `payment`
  ADD PRIMARY KEY (`payment_id`),
  ADD KEY `order_id` (`order_id`);

--
-- Indexes for table `reservation`
--
ALTER TABLE `reservation`
  ADD PRIMARY KEY (`reservation_id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `table_id` (`table_id`);

--
-- Indexes for table `restaurant`
--
ALTER TABLE `restaurant`
  ADD PRIMARY KEY (`restaurant_id`);

--
-- Indexes for table `restaurant_tables`
--
ALTER TABLE `restaurant_tables`
  ADD PRIMARY KEY (`table_id`),
  ADD UNIQUE KEY `restaurant_id` (`restaurant_id`,`table_number`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `category`
--
ALTER TABLE `category`
  MODIFY `category_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `customer`
--
ALTER TABLE `customer`
  MODIFY `customer_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `employee`
--
ALTER TABLE `employee`
  MODIFY `employee_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `menu_item`
--
ALTER TABLE `menu_item`
  MODIFY `item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `order_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `order_item`
--
ALTER TABLE `order_item`
  MODIFY `order_item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `payment`
--
ALTER TABLE `payment`
  MODIFY `payment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `reservation`
--
ALTER TABLE `reservation`
  MODIFY `reservation_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `restaurant`
--
ALTER TABLE `restaurant`
  MODIFY `restaurant_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `restaurant_tables`
--
ALTER TABLE `restaurant_tables`
  MODIFY `table_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `employee`
--
ALTER TABLE `employee`
  ADD CONSTRAINT `employee_ibfk_1` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurant` (`restaurant_id`);

--
-- Constraints for table `menu_item`
--
ALTER TABLE `menu_item`
  ADD CONSTRAINT `menu_item_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `category` (`category_id`);

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`),
  ADD CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurant` (`restaurant_id`),
  ADD CONSTRAINT `orders_ibfk_3` FOREIGN KEY (`table_id`) REFERENCES `restaurant_tables` (`table_id`),
  ADD CONSTRAINT `orders_ibfk_4` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`employee_id`);

--
-- Constraints for table `order_item`
--
ALTER TABLE `order_item`
  ADD CONSTRAINT `order_item_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_item_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `menu_item` (`item_id`);

--
-- Constraints for table `payment`
--
ALTER TABLE `payment`
  ADD CONSTRAINT `payment_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`);

--
-- Constraints for table `reservation`
--
ALTER TABLE `reservation`
  ADD CONSTRAINT `reservation_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`),
  ADD CONSTRAINT `reservation_ibfk_2` FOREIGN KEY (`table_id`) REFERENCES `restaurant_tables` (`table_id`);

--
-- Constraints for table `restaurant_tables`
--
ALTER TABLE `restaurant_tables`
  ADD CONSTRAINT `restaurant_tables_ibfk_1` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurant` (`restaurant_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
