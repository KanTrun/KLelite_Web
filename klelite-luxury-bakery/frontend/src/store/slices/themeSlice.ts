import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { IThemeConfig } from '../../types/theme.types';
import themeService from '../../services/themeService';

interface ThemeState {
  currentTheme: IThemeConfig | null;
  themes: IThemeConfig[];
  loading: boolean;
  error: string | null;
}

const initialState: ThemeState = {
  currentTheme: null,
  themes: [],
  loading: false,
  error: null,
};

// Async Thunks
export const fetchCurrentTheme = createAsyncThunk(
  'theme/fetchCurrent',
  async (_, { rejectWithValue }) => {
    try {
      const response = await themeService.getCurrentTheme();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch current theme');
    }
  }
);

export const fetchAllThemes = createAsyncThunk(
  'theme/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await themeService.getAllThemes();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch themes');
    }
  }
);

export const createTheme = createAsyncThunk(
  'theme/create',
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await themeService.createTheme(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create theme');
    }
  }
);

export const updateTheme = createAsyncThunk(
  'theme/update',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await themeService.updateTheme(id, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update theme');
    }
  }
);

export const activateTheme = createAsyncThunk(
  'theme/activate',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await themeService.activateTheme(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to activate theme');
    }
  }
);

export const deleteTheme = createAsyncThunk(
  'theme/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await themeService.deleteTheme(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete theme');
    }
  }
);

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // fetchCurrentTheme
    builder
      .addCase(fetchCurrentTheme.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCurrentTheme.fulfilled, (state, action: PayloadAction<IThemeConfig>) => {
        state.loading = false;
        state.currentTheme = action.payload;
      })
      .addCase(fetchCurrentTheme.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // fetchAllThemes
    builder
      .addCase(fetchAllThemes.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllThemes.fulfilled, (state, action: PayloadAction<IThemeConfig[]>) => {
        state.loading = false;
        state.themes = action.payload;
      })
      .addCase(fetchAllThemes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // createTheme
    builder
      .addCase(createTheme.fulfilled, (state, action: PayloadAction<IThemeConfig>) => {
        state.themes.unshift(action.payload);
      });

    // updateTheme
    builder
      .addCase(updateTheme.fulfilled, (state, action: PayloadAction<IThemeConfig>) => {
        const index = state.themes.findIndex((t) => t._id === action.payload._id);
        if (index !== -1) {
          state.themes[index] = action.payload;
        }
        if (state.currentTheme?._id === action.payload._id && state.currentTheme.isActive) {
          state.currentTheme = action.payload;
        }
      });

    // activateTheme
    builder
      .addCase(activateTheme.fulfilled, (state, action: PayloadAction<IThemeConfig>) => {
        state.currentTheme = action.payload;
        state.themes = state.themes.map((t) => ({
          ...t,
          isActive: t._id === action.payload._id,
        }));
      });

    // deleteTheme
    builder
      .addCase(deleteTheme.fulfilled, (state, action: PayloadAction<string>) => {
        state.themes = state.themes.filter((t) => t._id !== action.payload);
      });
  },
});

export default themeSlice.reducer;
