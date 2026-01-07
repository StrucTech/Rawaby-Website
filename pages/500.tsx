export default function Custom500() {
  return null;
}

// Redirect to home on 500 error
export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/',
      permanent: false,
    },
  };
}
