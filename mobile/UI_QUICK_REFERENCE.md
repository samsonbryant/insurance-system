# IVAS Mobile UI Quick Reference Guide

## 🎨 Theme Usage

### Import Theme
```javascript
import { theme, commonStyles } from '../styles/theme';
import { responsiveWidth, responsiveHeight, responsiveFontSize } from '../utils/responsive';
```

### Common Patterns
```javascript
// Container
const styles = StyleSheet.create({
  container: {
    ...commonStyles.container,  // flex: 1, backgroundColor: theme.colors.background
  },
});

// Card
const styles = StyleSheet.create({
  card: {
    ...commonStyles.card,  // backgroundColor, borderRadius, padding, shadow
  },
});

// Button
const styles = StyleSheet.create({
  button: {
    ...commonStyles.button,
    ...commonStyles.buttonPrimary,  // backgroundColor: theme.colors.primary
  },
  buttonText: {
    ...commonStyles.buttonText,  // color: theme.colors.surface, fontSize, fontWeight
  },
});
```

## 📱 Responsive Design

### Dimensions
```javascript
// Width/Height
width: responsiveWidth(300)
height: responsiveHeight(200)

// Font Size
fontSize: responsiveFontSize(16)

// Device Detection
if (isTablet) { /* tablet styles */ }
if (isDesktop) { /* desktop styles */ }
```

### Grid Layout
```javascript
const columns = getGridColumns(150, theme.spacing.md);
const cardWidth = getCardWidth(theme.spacing.lg);
```

## 🔄 Loading States

### Basic Loading
```javascript
import LoadingSpinner from '../components/LoadingSpinner';

<LoadingSpinner size="medium" text="Loading..." />
```

### Loading Overlay
```javascript
import { LoadingOverlay } from '../components/LoadingSpinner';

<LoadingOverlay visible={loading} text="Processing..." />
```

### Loading Card
```javascript
import { LoadingCard } from '../components/LoadingSpinner';

<LoadingCard text="Loading content..." />
```

## 🔔 Notifications

### Setup
```javascript
import { useNotifications } from '../components/NotificationProvider';

const { showSuccess, showError, showWarning, showInfo } = useNotifications();
```

### Usage
```javascript
// Success
showSuccess('Operation completed successfully');

// Error
showError('Something went wrong');

// Warning
showWarning('Please check your input');

// Info
showInfo('Additional information');
```

## 🔌 Real-time Features

### Connection Status
```javascript
import { useRealTime } from '../services/realTimeService';

const { isConnected, connectionError } = useRealTime(token);

// Display connection indicator
{isConnected ? (
  <Ionicons name="wifi" color={theme.colors.success} />
) : (
  <Ionicons name="wifi-off" color={theme.colors.danger} />
)}
```

### Event Handling
```javascript
import { useRealTimeEvents } from '../services/realTimeService';

const data = useRealTimeEvents(['verification_update', 'stats_update']);

// Use the data
useEffect(() => {
  if (data.verification_update) {
    // Handle verification update
  }
}, [data]);
```

## 🎯 Common Components

### Status Badge
```javascript
const StatusBadge = ({ status, children }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'valid': return theme.colors.success;
      case 'fake': return theme.colors.danger;
      case 'expired': return theme.colors.warning;
      default: return theme.colors.secondary;
    }
  };

  return (
    <View style={[styles.badge, { backgroundColor: getStatusColor(status) + '20' }]}>
      <Text style={[styles.badgeText, { color: getStatusColor(status) }]}>
        {children}
      </Text>
    </View>
  );
};
```

### Metric Item
```javascript
const MetricItem = ({ icon, value, label, color = theme.colors.textSecondary }) => (
  <View style={styles.metricItem}>
    <Ionicons name={icon} size={responsiveFontSize(16)} color={color} />
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
);
```

### Empty State
```javascript
const EmptyState = ({ icon, title, subtitle, action }) => (
  <View style={styles.emptyContainer}>
    <Ionicons name={icon} size={responsiveFontSize(64)} color={theme.colors.textMuted} />
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptySubtitle}>{subtitle}</Text>
    {action && (
      <TouchableOpacity style={styles.emptyAction} onPress={action.onPress}>
        <Ionicons name={action.icon} size={responsiveFontSize(20)} color={theme.colors.surface} />
        <Text style={styles.emptyActionText}>{action.text}</Text>
      </TouchableOpacity>
    )}
  </View>
);
```

## 📐 Layout Patterns

### Header Pattern
```javascript
const Header = ({ title, leftAction, rightAction }) => (
  <View style={styles.header}>
    {leftAction && (
      <TouchableOpacity style={styles.headerButton} onPress={leftAction.onPress}>
        <Ionicons name={leftAction.icon} size={responsiveFontSize(24)} color={theme.colors.primary} />
      </TouchableOpacity>
    )}
    <Text style={styles.headerTitle}>{title}</Text>
    {rightAction && (
      <TouchableOpacity style={styles.headerButton} onPress={rightAction.onPress}>
        <Ionicons name={rightAction.icon} size={responsiveFontSize(20)} color={theme.colors.primary} />
      </TouchableOpacity>
    )}
  </View>
);
```

### Card Pattern
```javascript
const Card = ({ children, style, onPress }) => {
  const CardComponent = onPress ? TouchableOpacity : View;
  
  return (
    <CardComponent style={[styles.card, style]} onPress={onPress}>
      {children}
    </CardComponent>
  );
};
```

### List Item Pattern
```javascript
const ListItem = ({ icon, title, subtitle, rightComponent, onPress }) => (
  <TouchableOpacity style={styles.listItem} onPress={onPress}>
    <View style={styles.listItemLeft}>
      <Ionicons name={icon} size={responsiveFontSize(24)} color={theme.colors.primary} />
      <View style={styles.listItemContent}>
        <Text style={styles.listItemTitle}>{title}</Text>
        {subtitle && <Text style={styles.listItemSubtitle}>{subtitle}</Text>}
      </View>
    </View>
    {rightComponent || (onPress && (
      <Ionicons name="chevron-forward" size={responsiveFontSize(20)} color={theme.colors.textMuted} />
    ))}
  </TouchableOpacity>
);
```

## 🎨 Color Usage

### Status Colors
```javascript
const getStatusColor = (status) => {
  switch (status) {
    case 'success': return theme.colors.success;
    case 'error': return theme.colors.danger;
    case 'warning': return theme.colors.warning;
    case 'info': return theme.colors.info;
    default: return theme.colors.secondary;
  }
};
```

### Text Colors
```javascript
// Primary text
color: theme.colors.textPrimary

// Secondary text
color: theme.colors.textSecondary

// Muted text
color: theme.colors.textMuted

// Light text
color: theme.colors.textLight
```

## 📏 Spacing

### Consistent Spacing
```javascript
// Use theme spacing
padding: theme.spacing.md        // 16px
margin: theme.spacing.lg         // 24px
paddingHorizontal: theme.spacing.xl  // 32px

// Responsive spacing
padding: responsiveHeight(theme.spacing.md)
margin: responsiveWidth(theme.spacing.lg)
```

## 🔧 Common Styles

### Shadows
```javascript
// Small shadow
...theme.shadows.sm

// Medium shadow
...theme.shadows.md

// Large shadow
...theme.shadows.lg
```

### Border Radius
```javascript
borderRadius: theme.borderRadius.sm    // 4px
borderRadius: theme.borderRadius.md    // 8px
borderRadius: theme.borderRadius.lg    // 12px
borderRadius: theme.borderRadius.round // 60px
```

## 🚀 Performance Tips

### FlatList Optimization
```javascript
<FlatList
  data={data}
  renderItem={renderItem}
  keyExtractor={(item) => item.id.toString()}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={10}
/>
```

### Image Optimization
```javascript
<Image
  source={{ uri: imageUrl }}
  style={styles.image}
  resizeMode="cover"
  loadingIndicatorSource={require('../assets/placeholder.png')}
/>
```

## 🐛 Debugging

### Theme Debugging
```javascript
// Log theme values
console.log('Theme colors:', theme.colors);
console.log('Theme spacing:', theme.spacing);
```

### Responsive Debugging
```javascript
// Log responsive values
console.log('Screen width:', Dimensions.get('window').width);
console.log('Responsive width:', responsiveWidth(300));
```

### Real-time Debugging
```javascript
// Log connection status
const { isConnected, connectionError } = useRealTime(token);
console.log('Connected:', isConnected, 'Error:', connectionError);
```

---

**Quick Tips:**
- Always use theme variables instead of hardcoded values
- Use responsive utilities for all dimensions
- Implement proper loading and error states
- Use FlatList for large lists
- Test on different screen sizes
- Use proper accessibility props
