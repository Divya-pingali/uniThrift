import { View } from 'react-native';
import GooglePlacesTextInput from 'react-native-google-places-textinput';

const LocationSearch = ({ onSelect }) => {
  const handlePlaceSelect = (place) => {
    console.log('Selected place:', place);
    if (onSelect) {
      onSelect(place);
    }
  };

  const customStyles = {
    container: {
      width: '100%',
      marginHorizontal: 0,
    },
    input: {
      height: 45,
      borderColor: '#ccc',
      borderRadius: 8,
    },
    suggestionsContainer: {
      backgroundColor: '#ffffff',
      maxHeight: 250,
    },
    suggestionItem: {
      padding: 15,
    },
    suggestionText: {
      main: {
        fontSize: 16,
        color: '#333',
      },
      secondary: {
        fontSize: 14,
        color: '#666',
      }
    },
    loadingIndicator: {
      color: '#999',
    },
    placeholder: {
      color: '#999',
    }
  };

  return (
    <View style={{ width: '100%' }}>
    <GooglePlacesTextInput
      apiKey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}
      onPlaceSelect={handlePlaceSelect}
      includedRegionCodes={['HK']}
      styles={customStyles}
      placeHolderText='Meetup Location'
    />
    </View>
  );
};
export default LocationSearch;