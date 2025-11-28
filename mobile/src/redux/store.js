import { createStore, combineReducers, applyMiddleware } from 'redux';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import thunk from 'redux-thunk';

// Import reducers
import authReducer from './reducers/authReducer';
import userReducer from './reducers/userReducer';
import companyReducer from './reducers/companyReducer';
import policyReducer from './reducers/policyReducer';
import verificationReducer from './reducers/verificationReducer';
import appReducer from './reducers/appReducer';

// Persist config
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'user'], // Only persist auth and user data
  blacklist: ['app'] // Don't persist app state like loading indicators
};

const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  company: companyReducer,
  policy: policyReducer,
  verification: verificationReducer,
  app: appReducer
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Create store
export const store = createStore(
  persistedReducer,
  applyMiddleware(thunk)
);

// Create persistor
export const persistor = persistStore(store);
