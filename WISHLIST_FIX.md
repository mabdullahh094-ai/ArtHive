# Fix Required for Wishlist.js

The file `d:\FYP\arthive-frontend\src\pages\user\Wishlist.js` also needs the same auth loading fix.

## Change needed:

Line 29-31, replace:
```javascript
const { user } = useAuth();
```

With:
```javascript
const { user, isLoading: authLoading } = useAuth();
```

Line 36-40, replace:
```javascript
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
```

With:
```javascript
  useEffect(() => {
    // Don't redirect while auth is still loading
    if (authLoading) return;
    
    if (!user) {
      navigate('/login');
      return;
    }
```

Line 43, update dependencies:
```javascript
  }, [user, authLoading, navigate, cartLoading]);
```
