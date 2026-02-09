// src/services/mockAPI.js
export const mockAPI = {
  auth: {
    register: async (userData) => {
      console.log("Mock API: Register called with:", userData);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Check if email already exists (mock check)
      const users = JSON.parse(localStorage.getItem("mockUsers") || "[]");
      const existingUser = users.find(user => user.email === userData.email);
      
      if (existingUser) {
        throw new Error("Email already registered");
      }
      
      // Create new user
      const newUser = {
        id: Date.now(),
        ...userData,
        role: "buyer",
        isVerified: false,
        createdAt: new Date().toISOString(),
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=random`,
      };
      
      // Remove password before storing
      const { password, confirmPassword, ...userWithoutPassword } = newUser;
      
      // Save to mock database
      users.push(userWithoutPassword);
      localStorage.setItem("mockUsers", JSON.stringify(users));
      
      // Return success response
      return {
        success: true,
        message: "Registration successful! You can now login.",
        user: userWithoutPassword,
      };
    },
    
    login: async (credentials) => {
      console.log("Mock API: Login called with:", credentials);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const users = JSON.parse(localStorage.getItem("mockUsers") || "[]");
      const user = users.find(u => u.email === credentials.email);
      
      if (!user) {
        throw new Error("User not found");
      }
      
      // In real app, you'd verify password hash here
      // For mock, accept any password
      
      const token = "mock-jwt-token-" + Date.now();
      localStorage.setItem("mockToken", token);
      localStorage.setItem("mockUser", JSON.stringify(user));
      
      return {
        success: true,
        token: token,
        refreshToken: "mock-refresh-token",
        user: user,
      };
    },
    
    getProfile: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      const user = localStorage.getItem("mockUser");
      return user ? JSON.parse(user) : null;
    },
    
    logout: async () => {
      localStorage.removeItem("mockToken");
      localStorage.removeItem("mockUser");
    },
  },
  cart: {

    getCart: async () => {

      await new Promise(resolve => setTimeout(resolve, 500));

      const cart = localStorage.getItem("mockCart");

      return {

        items: cart ? JSON.parse(cart) : [],

        total: 0,

        itemCount: cart ? JSON.parse(cart).length : 0,

      };

    },

    

    addToCart: async (artworkId, quantity = 1) => {

      await new Promise(resolve => setTimeout(resolve, 300));

      

      const cart = JSON.parse(localStorage.getItem("mockCart") || "[]");

      const existingItem = cart.find(item => item.artworkId === artworkId);

      

      if (existingItem) {

        existingItem.quantity += quantity;

      } else {

        cart.push({

          id: Date.now(),

          artworkId,

          quantity,

          addedAt: new Date().toISOString(),

        });

      }

      

      localStorage.setItem("mockCart", JSON.stringify(cart));

      return { success: true };

    },

    

    updateCartItem: async (cartItemId, quantity) => {

      await new Promise(resolve => setTimeout(resolve, 300));

      

      const cart = JSON.parse(localStorage.getItem("mockCart") || "[]");

      const updatedCart = cart.map(item => 

        item.id === cartItemId ? { ...item, quantity } : item

      ).filter(item => item.quantity > 0);

      

      localStorage.setItem("mockCart", JSON.stringify(updatedCart));

      return { success: true };

    },

    

    removeFromCart: async (cartItemId) => {

      await new Promise(resolve => setTimeout(resolve, 300));

      

      const cart = JSON.parse(localStorage.getItem("mockCart") || "[]");

      const updatedCart = cart.filter(item => item.id !== cartItemId);

      

      localStorage.setItem("mockCart", JSON.stringify(updatedCart));

      return { success: true };

    },

    

    clearCart: async () => {

      localStorage.removeItem("mockCart");

      return { success: true };

    },

  },

};

