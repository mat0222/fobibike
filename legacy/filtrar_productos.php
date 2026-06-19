<?php
header('Content-Type: application/json; charset=utf-8');
error_reporting(E_ALL);
ini_set('display_errors', 1);
include 'config.php';

$search   = $_GET['search'] ?? '';
$category = $_GET['category'] ?? '';
$supplier = $_GET['supplier'] ?? '';
$type     = $_GET['type'] ?? '';
$stock    = $_GET['stock'] ?? '';
$stockArray = array_filter(explode(',', $stock));

$where = [];
$params = [];
$types = "";

if ($category && $category !== 'all') {
    $where[] = "category=?";
    $params[] = $category;
    $types .= "s";
}

if ($search) {
    $where[] = "(name LIKE ? OR code LIKE ?)";
    $params[] = "%$search%";
    $params[] = "%$search%";
    $types .= "ss";
}

if ($supplier) {
    $where[] = "supplier=?";
    $params[] = $supplier;
    $types .= "s";
}

if ($type) {
    $where[] = "type=?";
    $params[] = $type;
    $types .= "s";
}

if (count($stockArray) > 0) {
    $stockConditions = [];
    foreach ($stockArray as $s) {
        switch($s) {
            case 'in-stock': $stockConditions[] = "stock > 5"; break;
            case 'low-stock': $stockConditions[] = "stock BETWEEN 1 AND 5"; break;
            case 'out-of-stock': $stockConditions[] = "stock = 0"; break;
        }
    }
    if (count($stockConditions) > 0) {
        $where[] = "(" . implode(" OR ", $stockConditions) . ")";
    }
}

$sql = "SELECT * FROM productos";
if (count($where) > 0) $sql .= " WHERE " . implode(" AND ", $where);

$stmt = $conn->prepare($sql);
if ($stmt && count($params) > 0) {
    $stmt->bind_param($types, ...$params);
}
$stmt->execute();
$result = $stmt->get_result();

$productos = [];
while ($row = $result->fetch_assoc()) {
    $productos[] = [
        'code' => $row['codigo'],
        'name' => $row['modelo'],
        'category' => $row['category'],
        'supplier' => $row['supplier'],
        'type' => $row['type'],
        'price' => floatval($row['precio_contado']),
        'installmentPrice' => floatval($row['precio_plazo']),
        'stock' => intval($row['stock'])
    ];
}

echo json_encode($productos);
$conn->close();
?>
