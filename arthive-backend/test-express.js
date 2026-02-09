console.log("=== Testing Express Installation ===");

try {
    const express = require("express");
    console.log("✅ Express loaded successfully");
    
    const app = express();
    console.log("✅ Express app created");
    
    // Test basic middleware
    app.use((req, res, next) => {
        console.log("✅ Middleware works");
        next();
    });
    
    console.log("=== All Express tests passed ===");
    process.exit(0);
} catch (error) {
    console.error("❌ Express test failed:", error.message);
    console.error("Stack:", error.stack);
    process.exit(1);
}
