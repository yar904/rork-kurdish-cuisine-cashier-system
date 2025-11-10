# Tapse Restaurant Management System - Summary

## 🎯 Platform Overview

**Tapse** is a comprehensive multilingual restaurant management system built for Kurdish Cuisine. It's a cross-platform React Native application deployed on Rork Native hosting with offline PWA capabilities.

---

## 🏗️ System Architecture

### Frontend
- **Framework**: React Native + Expo (v53)
- **Language**: TypeScript (strict mode)
- **State Management**: 
  - React Context API with `@nkzw/create-context-hook`
  - React Query for server state
  - AsyncStorage for offline persistence
- **Routing**: Expo Router (file-based)
- **Styling**: StyleSheet API

### Backend
- **Runtime**: Node.js with Hono framework
- **API**: tRPC for type-safe endpoints
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Rork Native Backend

### AI Integration
- **Provider**: Rork AI SDK (no external API keys needed)
- **Features**: 
  - Multilingual chatbot (English, Kurdish, Arabic)
  - Voice ordering support
  - Predictive analytics
  - AI recommendations

---

## 📱 User Roles & Interfaces

### 1. **Customer Interface** (`/menu`)
- QR code table selection
- Multilingual menu browsing (English/Kurdish/Arabic)
- Digital ordering system
- Order tracking
- AI chatbot assistant (Baran)
- Voice ordering
- Rating system

### 2. **Waiter Interface** (`/waiter`)
- Table management
- Service request handling
- Order status updates
- Customer assistance tracking

### 3. **Kitchen Interface** (`/kitchen`)
- Real-time order queue
- Order status management (preparing → ready)
- Priority sorting
- Time tracking

### 4. **Cashier Interface** (`/cashier`)
- Payment processing
- Order completion
- Receipt generation
- Transaction history

### 5. **Admin Interface** (`/admin`)
- Menu management (CRUD operations)
- Staff oversight
- System configuration
- User management

### 6. **Analytics & Reports** (`/analytics`, `/reports`)
- Real-time sales dashboard
- Revenue analytics
- Popular items tracking
- Time-based comparisons
- Customer behavior insights
- Rating statistics

---

## 🌍 Multilingual Support

### Supported Languages
1. **English** (en)
2. **Kurdish Sorani** (ku) - کوردی
3. **Arabic** (ar) - عربي

### Implementation
- Context-based language switching (`LanguageContext`)
- RTL support for Kurdish and Arabic
- AI chatbot responds in user's language
- All UI elements translated
- Currency formatting (IQD)

---

## 🔌 Offline Capabilities (PWA)

### Offline Features
- Service Worker caching
- Offline banner notifications
- AsyncStorage persistence
- Queue failed requests for sync
- Manifest for installable web app

### Files
- `public/service-worker.js` - Caching strategy
- `public/manifest.json` - PWA configuration
- `contexts/OfflineContext.tsx` - Offline state management
- `components/OfflineBanner.tsx` - UI indicator

---

## 🤖 AI Features (Powered by Rork AI)

### 1. **AI Chatbot** - Baran
<<<<<<< HEAD
=======
- **Location**: `components/AIChatbot.tsx`
>>>>>>> 3d65eb3cb3ed8162e20b96c17185529fc5c9cee3
- **SDK**: `useRorkAgent` hook
- **Capabilities**:
  - Answer menu questions
  - Take orders conversationally
  - Track order status
  - Call staff assistance
  - Multilingual conversation
  - Kurdish dish explanations

### 2. **Voice Ordering**
- **Location**: `components/VoiceOrderButton.tsx`
- **Flow**: Speech → Text → AI → Order
- **Uses**: Rork's Speech-to-Text API

### 3. **AI Recommendations**
- **Location**: `components/AIRecommendations.tsx`
- **Logic**: Analyzes order history + ratings
- **Output**: Personalized menu suggestions

### 4. **Predictive Analytics**
- **Location**: `components/PredictiveAnalytics.tsx`
- **Insights**: Sales forecasts, demand patterns

---

## 🗄️ Database Schema (Supabase)

### Core Tables
1. **menu_items** - Menu catalog with categories, prices, ingredients
2. **orders** - Order records with status tracking
3. **order_items** - Individual items per order
4. **tables** - Restaurant table management
5. **service_requests** - Customer assistance tracking
6. **ratings** - Customer feedback system
7. **customer_history** - QR-based customer identification

### Key Relationships
- Orders → Order Items (1:many)
- Tables → Orders (1:many)
- Menu Items → Ratings (1:many)
- Tables → Customer History (1:1)

---

## 🔐 Security & State Management

### Authentication
- **Context**: `AuthContext.tsx`
- **Roles**: Admin, Waiter, Kitchen, Cashier
- **Storage**: AsyncStorage (persisted)

### State Contexts
1. **AuthContext** - User authentication & roles
2. **RestaurantContext** - Orders, menu, tables, service requests
3. **LanguageContext** - i18n management
4. **TableContext** - Table selection & status
5. **OfflineContext** - Network status & sync

---

## 📊 Order Flow

```
Customer Scans QR → Selects Table → Browses Menu → Places Order
                                                           ↓
Kitchen Receives → Prepares → Marks Ready → Waiter Serves
                                                           ↓
Customer Finishes → Requests Bill → Cashier Processes → Order Complete
```

### Order States
1. `pending` - Just placed
2. `confirmed` - Acknowledged by kitchen
3. `preparing` - Being cooked
4. `ready` - Ready for serving
5. `served` - Delivered to table
6. `completed` - Paid and closed

---

## 🚀 Deployment

### Frontend
- **Host**: Rork Native
- **URL**: `https://kurdish-cuisine-cashier-system.rork.app`
- **Build**: Expo Web + PWA

### Backend
- **API Base**: Same domain + `/api`
- **tRPC Endpoints**: `/api/trpc/*`
- **Framework**: Hono (Node.js)

### Environment Variables
```env
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
EXPO_PUBLIC_RORK_API_BASE_URL
```

**Note**: No OpenAI API key needed - using Rork AI SDK

---

## 🛠️ Key Technologies

### Dependencies
- `expo` - Mobile framework
- `react-native` - UI components
- `@tanstack/react-query` - Server state
- `@trpc/client` - Type-safe API
<<<<<<< HEAD
=======
- `@rork/toolkit-sdk` - AI features
>>>>>>> 3d65eb3cb3ed8162e20b96c17185529fc5c9cee3
- `@supabase/supabase-js` - Database client
- `lucide-react-native` - Icons
- `expo-camera` - QR scanning
- `expo-av` - Voice recording

### Dev Tools
- TypeScript (strict)
- ESLint
- Bun (package manager)

---

## 📝 Development Workflow

### Starting the System
```bash
# Start frontend + backend
bun run start-fullstack

# Or separately:
bun start              # Frontend only
cd backend && bun dev  # Backend only
```

### File Structure
```
app/                    # Routes (Expo Router)
├── (tabs)/            # Tab navigation
├── category/          # Category detail pages
├── index.tsx          # Landing page
└── menu.tsx           # Customer menu

components/            # Reusable UI components
contexts/              # React Context providers
backend/               # Hono + tRPC backend
├── trpc/
│   └── routes/        # API endpoints
constants/             # Static data
types/                 # TypeScript definitions
```

---

## 🎨 Design Philosophy

### Mobile-First
- Touch-optimized interactions
- Native feel with React Native
- Platform-specific adaptations (iOS/Android/Web)

### Accessibility
- RTL language support
- Color contrast compliance
- Keyboard navigation
- Screen reader compatibility

### Performance
- Optimistic updates
- React Query caching
- Image lazy loading
- Code splitting

---

## 🔮 Future Enhancements

### Planned Features
- [ ] Kitchen display system (KDS)
- [ ] Inventory management
- [ ] Staff scheduling
- [ ] Loyalty program
- [ ] Email/SMS notifications
- [ ] Multi-location support
- [ ] Advanced reporting

### AI Roadmap
- [ ] Image-based food search
- [ ] Automated upselling
- [ ] Demand forecasting
- [ ] Customer sentiment analysis

---

## 📞 Support & Documentation

### Key Documentation Files
- `QUICK_START.md` - Setup guide
- `DATABASE_SETUP.md` - Supabase configuration
- `PWA_OFFLINE_SETUP.md` - Offline capabilities
- `RESTAURANT_SYSTEM_GUIDE.md` - Feature overview
- `PLATFORM_OVERVIEW.md` - Technical architecture

---

## 🎯 Success Metrics

### KPIs Tracked
- Average order time (place → ready)
- Customer satisfaction (ratings)
- Table turnover rate
- Revenue per table
- Popular menu items
- Peak hours analytics
- Service request response time

---

**Built with ❤️ for Tapse Kurdish Restaurant**
*Powered by Rork Native Platform*
