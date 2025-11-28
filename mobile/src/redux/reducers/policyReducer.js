// Policy Reducer
const initialState = {
  policies: [],
  currentPolicy: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  }
};

const policyReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'GET_POLICIES_REQUEST':
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case 'GET_POLICIES_SUCCESS':
      return {
        ...state,
        policies: action.payload.policies,
        pagination: action.payload.pagination,
        loading: false,
        error: null
      };
    
    case 'GET_POLICIES_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    
    case 'GET_POLICY_REQUEST':
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case 'GET_POLICY_SUCCESS':
      return {
        ...state,
        currentPolicy: action.payload,
        loading: false,
        error: null
      };
    
    case 'GET_POLICY_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    
    case 'CREATE_POLICY_REQUEST':
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case 'CREATE_POLICY_SUCCESS':
      return {
        ...state,
        policies: [action.payload, ...state.policies],
        loading: false,
        error: null
      };
    
    case 'CREATE_POLICY_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    
    case 'UPDATE_POLICY_REQUEST':
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case 'UPDATE_POLICY_SUCCESS':
      return {
        ...state,
        policies: state.policies.map(policy => 
          policy.id === action.payload.id ? action.payload : policy
        ),
        currentPolicy: action.payload,
        loading: false,
        error: null
      };
    
    case 'UPDATE_POLICY_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    
    case 'SYNC_POLICIES_REQUEST':
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case 'SYNC_POLICIES_SUCCESS':
      return {
        ...state,
        loading: false,
        error: null
      };
    
    case 'SYNC_POLICIES_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    
    case 'CLEAR_POLICY_ERROR':
      return {
        ...state,
        error: null
      };
    
    case 'CLEAR_CURRENT_POLICY':
      return {
        ...state,
        currentPolicy: null
      };
    
    default:
      return state;
  }
};

export default policyReducer;
