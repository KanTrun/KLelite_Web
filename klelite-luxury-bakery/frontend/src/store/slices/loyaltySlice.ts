import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { LoyaltyAccount, PointTransaction } from '@/services/loyaltyService';
import { loyaltyService } from '@/services/loyaltyService';

interface LoyaltyState {
  account: LoyaltyAccount | null;
  history: PointTransaction[];
  isLoading: boolean;
  error: string | null;
}

const initialState: LoyaltyState = {
  account: null,
  history: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchLoyaltyAccount = createAsyncThunk<LoyaltyAccount>(
  'loyalty/fetchAccount',
  async (_, { rejectWithValue }) => {
    try {
      const account = await loyaltyService.getMyLoyalty();
      return account;
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to fetch loyalty account');
    }
  }
);

export const fetchPointsHistory = createAsyncThunk<PointTransaction[]>(
  'loyalty/fetchHistory',
  async (_, { rejectWithValue }) => {
    try {
      const history = await loyaltyService.getPointsHistory();
      return history;
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to fetch points history');
    }
  }
);

const loyaltySlice = createSlice({
  name: 'loyalty',
  initialState,
  reducers: {
    clearLoyalty: (state) => {
      state.account = null;
      state.history = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch account
    builder
      .addCase(fetchLoyaltyAccount.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLoyaltyAccount.fulfilled, (state, action) => {
        state.isLoading = false;
        state.account = action.payload;
      })
      .addCase(fetchLoyaltyAccount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch history
    builder
      .addCase(fetchPointsHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPointsHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.history = action.payload;
      })
      .addCase(fetchPointsHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearLoyalty } = loyaltySlice.actions;
export default loyaltySlice.reducer;
