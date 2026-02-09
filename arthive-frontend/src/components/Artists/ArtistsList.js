import React from "react";
import { Link } from "react-router-dom";
import { Container, Grid, Card, CardContent, Typography, Button, Avatar, Chip } from "@mui/material";

const ArtistsList = () => {
  const artists = [
    { id: "1", name: "Artist One", bio: "Bio one", artworkCount: 5 },
    { id: "2", name: "Artist Two", bio: "Bio two", artworkCount: 8 },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Featured Artists</Typography>
      <Grid container spacing={3}>
        {artists.map((artist) => (
          <Grid item xs={12} sm={6} md={4} key={artist.id}>
            <Card>
              <CardContent sx={{ textAlign: "center" }}>
                <Avatar sx={{ width: 120, height: 120, mx: "auto", mb: 2 }} />
                <Typography variant="h6" gutterBottom>{artist.name}</Typography>
                <Chip label={`${artist.artworkCount} artworks`} size="small" />
                <Button component={Link} to={`/artists/${artist.id}`} fullWidth sx={{ mt: 2 }}>
                  View Profile
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default ArtistsList;
