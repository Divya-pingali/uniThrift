import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { ActivityIndicator, List, Text, TextInput } from "react-native-paper";

export default function LocationSearch({ onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchLocation = async (text) => {
    if (text.length < 2) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);

      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        text
      )}&format=json&addressdetails=1&limit=5`;

      const res = await fetch(url, {
        headers: { "User-Agent": "UniThrift/1.0" },
      });

      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.log("Location search error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        mode="outlined"
        label="Meetup Location"
        placeholder="Meetup Location"
        value={query}
        onChangeText={(text) => {
          setQuery(text);
          searchLocation(text);
        }}
        style={styles.input}
        right={<TextInput.Icon icon="magnify" />}
      />

      {loading && <ActivityIndicator style={{ marginTop: 10 }} />}

      {results.map((item, index) => (
        <List.Item
          key={index}
          title={item.display_name}
          description={`Lat: ${item.lat}, Lon: ${item.lon}`}
          left={() => <List.Icon icon="map-marker" />}
          onPress={() => {
            onSelect({
              name: item.display_name,
              lat: item.lat,
              lon: item.lon,
            });
            setQuery(item.display_name);
            setResults([]);
          }}
          style={styles.listItem}
        />
      ))}

      {query.length > 1 && results.length === 0 && !loading && (
        <Text style={styles.noResults}>No results found</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "90%",
    marginBottom: 20,
  },
  input: {
    marginBottom: 10,
  },
  listItem: {
    backgroundColor: "#f1f1f1",
    borderRadius: 6,
    marginBottom: 6,
  },
  noResults: {
    marginTop: 10,
    color: "grey",
    textAlign: "center",
  },
});
