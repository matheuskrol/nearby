import { useEffect, useState, useRef } from "react"
import { Alert, View, Text } from "react-native";
import { api } from "@/services/api";
import { colors, fontFamily } from "@/styles/theme";
import { Categories, CategoriesProps } from "@/components/categories";
import { PlaceProps } from "@/components/place";
import { Places } from "@/components/places";
import MapView, { Callout, Marker } from "react-native-maps";
import * as Location from "expo-location"
import { LocationObject, watchPositionAsync } from "expo-location";
import { router } from "expo-router"

type MarketProps = PlaceProps & {
    latitude: number,
    longitude: number
}

const defaultLocation = {
    latitude: -23.561187293883442,
    longitude: -46.656451388116494
}

export default function Home() {
    const [categories, setCategories] = useState<CategoriesProps>([])
    const [category, setCategory] = useState("")
    const [markets, setMarkets] = useState<MarketProps[]>([])
    const [location, setLocation] = useState<LocationObject | null>(null)
    const mapRef = useRef<MapView>(null)

    async function fetchCategories() {
        try {
            const { data } = await api.get("/categories")
            setCategories(data)
            setCategory(data[0].id)
        } catch (error) {
            console.log(error)
            Alert.alert("Categorias", "Não foi possível carregar as categorias")
        }
    }

    async function fetchMarkets() {
        try {
            if (!category) {
                return
            }
            const { data } = await api.get("markets/category/" + category)
            setMarkets(data)
        } catch (error) {
            console.log(error)
            Alert.alert("Locais", "Não foi possível carregar os locais")
        }
    }

    async function getCurrentLocation() {
        try {
            const { granted } = await Location.requestForegroundPermissionsAsync()
            if (granted) {
                const location: Location.LocationObject = await Location.getCurrentPositionAsync()
                setLocation(location)
            }
        } catch (error) {
            console.log(error)
            Alert.alert("Localização", "Erro ao buscar localização")
        }
    }

    useEffect(() => {
        fetchCategories(),
            getCurrentLocation()
    }, [])

    useEffect(() => {
        fetchMarkets()
    }, [category])

    useEffect(() => {
        watchPositionAsync({
            accuracy: Location.LocationAccuracy.Highest,
            timeInterval: 1000,
            distanceInterval: 1
        }, (response) => {
            setLocation(response)
            mapRef.current?.animateCamera({
                center: response.coords
            })
        })
    })

    return (
        <View style={{ flex: 1 }}>
            <Categories data={categories} onSelect={setCategory} selected={category} />
            {
                //location &&
                <MapView
                    style={{ flex: 1 }}
                    //ref={mapRef}
                    initialRegion={{
                        latitude: defaultLocation.latitude, //location.coords.latitude,
                        longitude: defaultLocation.longitude, //location.coords.longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01
                    }}
                >
                    <Marker
                        identifier="current"
                        coordinate={{
                            latitude: defaultLocation.latitude, //location.coords.latitude,
                            longitude: defaultLocation.longitude //location.coords.longitude
                        }}
                        image={require("@/assets/location.png")}
                    />
                    {
                        markets.map((item) => (
                            <Marker
                                key={ item.id }
                                identifier={ item.id }
                                coordinate={{
                                    latitude: item.latitude,
                                    longitude: item.longitude
                                }}
                                image={require("@/assets/pin.png")}
                            >
                                <Callout onPress={() => router.navigate(`../market/${item.id}`)}>
                                    <View>
                                        <Text style={{ fontSize: 14, fontFamily: fontFamily.medium, color: colors.gray[600] }}>
                                            {item.name}
                                        </Text>
                                        <Text style={{ fontSize: 12, fontFamily: fontFamily.regular, color: colors.gray[600] }}>
                                            {item.address}
                                        </Text>
                                    </View>
                                </Callout>
                            </Marker>
                        ))
                    }
                </MapView>
            }
            <Places data={markets} />
        </View>
    )
}