import React, { useCallback, useEffect, useState } from 'react';

import { generatePath, useHistory, useParams } from 'react-router';
import { FormattedMessage } from 'react-intl';
import { useLocaleUrl } from '../../useLanguageFromParams/useLanguageFromParams.hook';
import { ROUTES } from '../../app.constants';
import { renderWhenTrue } from '../../../shared/utils/rendering';
import { useAsyncDispatch } from '../../../shared/utils/reduxSagaPromise';
import { confirmEmail } from '../../../modules/auth/auth.actions';

export const ConfirmEmail = () => {
  const history = useHistory();
  const dispatch = useAsyncDispatch();
  const { token, user } = useParams<{ token: string; user: string }>();
  const confirmRequestedUrl = useLocaleUrl(generatePath(ROUTES.confirmEmail, {}));
  const [validationError, setValidationError] = useState(false);

  const handleEmailConfirmation = useCallback(
    async ({ token, user }) => {
      try {
        const res = await dispatch(confirmEmail({ token, user }));
        history.push(confirmRequestedUrl);

        if (res.isError) {
          setValidationError(true);
        }
      } catch (ex) {
        setValidationError(true);
      }
    },
    [confirmRequestedUrl, dispatch, history]
  );

  useEffect(() => {
    if (token && user) {
      handleEmailConfirmation({ token, user });
    } else {
      setValidationError(true);
    }
  }, [handleEmailConfirmation, token, user]);

  return renderWhenTrue(() => (
    <h1>
      <FormattedMessage description={'Confirm email / Invalid token'} defaultMessage={'Invalid token'} />
    </h1>
  ))(validationError);
};