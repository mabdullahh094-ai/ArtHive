import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Box,
  Stack,
  Divider,
  TextField,
  InputAdornment,
  alpha,
} from "@mui/material";
import { Palette, ArrowForward, Search } from "@mui/icons-material";
import { artistAPI } from "../../services/api";

const ArtistsList = () => {
  const [artists, setArtists] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadArtists = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await artistAPI.getAll({ limit: 50 });
        const raw = Array.isArray(res?.data?.data) ? res.data.data : [];

        const mapped = raw
          .filter((item) => item?.verification_status === "verified")
          .map((item) => ({
            id: item.id,
            name: `${item.first_name || ""} ${item.last_name || ""}`.trim() || "Unknown Artist",
            artworkCount: Number(item.total_artworks || 0),
            avatar: item.profile_pic_url || "",
          }));

        setArtists(mapped);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load artists");
      } finally {
        setLoading(false);
      }
    };

    loadArtists();
  }, []);

  const filteredArtists = artists.filter((artist) =>
    artist.name.toLowerCase().includes(searchTerm.trim().toLowerCase()),
  );

  return (
    <Container
      maxWidth="xl"
      sx={{
        py: { xs: 3, md: 4 },
        background:
          "radial-gradient(circle at 0% 0%, rgba(37,99,235,0.08), transparent 34%), radial-gradient(circle at 100% 14%, rgba(245,158,11,0.08), transparent 30%)",
      }}
    >
      <Box
        sx={{
          mb: 3,
          p: { xs: 2, md: 2.5 },
          borderRadius: 3,
          border: "1px solid rgba(15,23,42,0.08)",
          background:
            "linear-gradient(135deg, rgba(15,23,42,0.96) 0%, rgba(30,64,175,0.94) 60%, rgba(245,158,11,0.88) 100%)",
          color: "white",
          boxShadow: "0 14px 28px rgba(15,23,42,0.22)",
        }}
      >
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: "1.45rem", md: "1.95rem" } }}>
              Featured Artists
            </Typography>
            <Typography sx={{ opacity: 0.9, mt: 0.4, fontSize: { xs: "0.86rem", md: "0.94rem" } }}>
              Explore verified creators and discover their latest work.
            </Typography>
          </Box>
        </Stack>

        <TextField
          fullWidth
          size="small"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search artist by name"
          sx={{
            mt: 2,
            "& .MuiOutlinedInput-root": {
              color: "white",
              borderRadius: 2,
              backgroundColor: "rgba(255,255,255,0.08)",
              "& fieldset": {
                borderColor: "rgba(255,255,255,0.24)",
              },
              "&:hover fieldset": {
                borderColor: "rgba(255,255,255,0.38)",
              },
              "&.Mui-focused fieldset": {
                borderColor: "rgba(255,255,255,0.62)",
              },
            },
            "& input::placeholder": {
              color: "rgba(255,255,255,0.82)",
              opacity: 1,
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: "rgba(255,255,255,0.88)" }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : artists.length === 0 ? (
        <Alert severity="info">No approved artists available right now.</Alert>
      ) : filteredArtists.length === 0 ? (
        <Alert severity="info">No artists match your search.</Alert>
      ) : (
        <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
          {filteredArtists.map((artist) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={artist.id}>
              <Card
                sx={{
                  height: "100%",
                  borderRadius: 2.5,
                  border: "1px solid rgba(15,23,42,0.08)",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  '&:hover': {
                    transform: "translateY(-4px)",
                    boxShadow: "0 14px 24px rgba(15,23,42,0.14)",
                  },
                }}
              >
                <CardContent sx={{ p: { xs: 1.25, md: 2 } }}>
                  <Stack
                    direction={{ xs: "row", sm: "column" }}
                    spacing={{ xs: 1.1, sm: 0 }}
                    alignItems={{ xs: "center", sm: "center" }}
                    sx={{ mb: 1 }}
                  >
                    <Box
                      sx={{
                        flexShrink: 0,
                        width: { xs: 64, sm: 92, md: 104 },
                        height: { xs: 64, sm: 92, md: 104 },
                        borderRadius: "50%",
                        p: 0.45,
                        background: "linear-gradient(135deg, rgba(37,99,235,0.28), rgba(245,158,11,0.28))",
                      }}
                    >
                      <Avatar src={artist.avatar} sx={{ width: "100%", height: "100%" }} />
                    </Box>

                    <Box sx={{ minWidth: 0, textAlign: { xs: "left", sm: "center" }, flex: 1 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontSize: { xs: "0.92rem", sm: "1rem" },
                          fontWeight: 700,
                          lineHeight: 1.15,
                        }}
                        noWrap
                      >
                        {artist.name}
                      </Typography>

                      <Typography
                        sx={{
                          fontSize: { xs: "0.68rem", sm: "0.74rem" },
                          color: "text.secondary",
                          mt: 0.2,
                        }}
                      >
                        Visual Artist
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack
                    direction="row"
                    spacing={0.7}
                    justifyContent={{ xs: "flex-start", sm: "center" }}
                    flexWrap="wrap"
                    useFlexGap
                    sx={{ mb: 1.05 }}
                  >
                    <Chip
                      icon={<Palette sx={{ fontSize: 14 }} />}
                      label={`${artist.artworkCount} artworks`}
                      size="small"
                      sx={{
                        fontSize: "0.66rem",
                        height: 24,
                        backgroundColor: alpha("#2563eb", 0.1),
                        color: "#1d4ed8",
                      }}
                    />
                    <Chip
                      label="Verified"
                      size="small"
                      sx={{
                        fontSize: "0.66rem",
                        height: 24,
                        backgroundColor: alpha("#16a34a", 0.11),
                        color: "#15803d",
                      }}
                    />
                  </Stack>

                  <Divider sx={{ mb: 1.05 }} />

                  <Button
                    component={Link}
                    to={`/artists/${artist.id}`}
                    fullWidth
                    variant="contained"
                    endIcon={<ArrowForward sx={{ fontSize: 15 }} />}
                    sx={{
                      borderRadius: 2,
                      py: 0.72,
                      fontSize: "0.72rem",
                      fontWeight: 700,
                    }}
                  >
                    View Profile
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default ArtistsList;
